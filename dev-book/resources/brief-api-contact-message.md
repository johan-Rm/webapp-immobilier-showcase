# Brief API — Entité `ContactMessage`

## Contexte

Le formulaire de contact de la webapp (public + fiche bien) persiste aujourd'hui les
soumissions dans un CSV local (`.data/contact-submissions.csv`) via la route Nitro
`server/api/contact.post.ts`, en plus de l'envoi email (Resend).

On veut remplacer ce stockage fichier par une **table côté API Symfony**. La route BFF
continuera d'envoyer l'email, mais persistera désormais via l'API au lieu du CSV.

## Périmètre

- **Création** : un `POST` depuis le BFF (route de contact), non exposé au public directement.
- **Lecture seule ensuite** : `GetCollection` + `Get` pour le backoffice.
- **Pas de `status`, pas de `Put`, pas de `Delete`** — aucun workflow de traitement. La
  ressource est en lecture seule une fois créée.

## Conventions à respecter (alignées sur l'existant)

- Ressource **project-scoped** : uriTemplates `/projects/{projectId}/contact-messages...`,
  `Link` vers `Project`, providers/processors `ProjectScoped*` comme `CategoryCode`.
- Traits : `UuidIdentity` (PK uuid), `AuditTrail` (`createdAt` / `updatedAt`), `ProjectOwned`.
- Serialization groups : `read` en sortie, `write` en entrée (création uniquement).
- `denormalizationContext` limité à la création.

## Champs

| Propriété           | Type Doctrine                              | Nullable | Contraintes                            | Groups          | Notes                           |
| ------------------- | ------------------------------------------ | -------- | -------------------------------------- | --------------- | ------------------------------- |
| `id`                | `uuid` (trait `UuidIdentity`)              | non      | PK                                     | `read`          |                                 |
| `project`           | ManyToOne `Project` (trait `ProjectOwned`) | non      | —                                      | —               | multi-tenant                    |
| `firstName`         | `string(120)`                              | non      | `NotBlank`, `Length(max=120)`          | `read`, `write` | prénom requis                   |
| `lastName`          | `string(120)`                              | **oui**  | `Length(max=120)`                      | `read`, `write` |                                 |
| `email`             | `string(254)`                              | non      | `NotBlank`, `Email`, `Length(max=254)` | `read`, `write` | 254 = max RFC 5321              |
| `phone`             | `string(40)`                               | **oui**  | `Length(max=40)`                       | `read`, `write` | pas de validation format        |
| `message`           | `text`                                     | non      | `NotBlank`, `Length(max=5000)`         | `read`, `write` | borne applicative               |
| `propertyReference` | `string(120)`                              | **oui**  | `Length(max=120)`                      | `read`, `write` | réf. du bien (formulaire fiche) |
| `locale`            | `string(5)`                                | **oui**  | `Length(max=5)`                        | `read`, `write` | langue de soumission (i18n)     |
| `userAgent`         | `string(512)`                              | **oui**  | `Length(max=512)`                      | `read`, `write` | technique / anti-spam           |
| `createdAt`         | `datetime_immutable` (trait `AuditTrail`)  | non      | auto                                   | `read`          | = `submittedAt` du CSV          |

> Les longueurs sont **identiques aux bornes appliquées côté webapp** (troncature serveur +
> `maxlength` front), pour garder front ↔ API cohérents.

### Champs volontairement absents

- **`status`** : pas de workflow, lecture seule → non demandé.
- **`website`** (honeypot anti-bot) : ne jamais persister, rejeté côté BFF avant appel API.
- **`ipAddress`** : ne pas stocker sauf besoin anti-spam justifié (RGPD).

## Opérations API Platform

```php
#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/projects/{projectId}/contact-messages',
            uriVariables: ['projectId' => new Link(fromClass: Project::class, identifiers: ['id'])],
            provider: ProjectScopedCollectionProvider::class,
        ),
        new Get(
            uriTemplate: '/projects/{projectId}/contact-messages/{id}',
            uriVariables: [
                'projectId' => new Link(fromClass: Project::class, identifiers: ['id'], toProperty: 'project'),
                'id' => new Link(fromClass: ContactMessage::class, identifiers: ['id']),
            ],
            provider: ProjectScopedItemProvider::class,
        ),
        new Post(
            uriTemplate: '/projects/{projectId}/contact-messages',
            uriVariables: ['projectId' => new Link(fromClass: Project::class, identifiers: ['id'])],
            read: false,
            processor: ProjectScopedPersistProcessor::class, // ou processor dédié si besoin
        ),
    ],
    normalizationContext: ['groups' => ['read']],
    denormalizationContext: ['groups' => ['write']],
)]
```

- Tri par défaut sur la collection : `createdAt DESC`.
- Pagination API Platform standard.

## Base de données

- Index sur `project_id` (`idx_contact_message_project`), cohérent avec les autres entités.
- Index sur `created_at` (tri backoffice).
- Pas de contrainte d'unicité (un visiteur peut envoyer plusieurs messages).

## Sécurité / RGPD

- `email`, `phone`, `userAgent` = données personnelles → prévoir **durée de rétention et purge**.
- Le `POST` doit être réservé au BFF (service account / auth serveur-à-serveur), pas ouvert au public.
- Lecture (`Get`/`GetCollection`) réservée aux comptes backoffice autorisés du projet.

## Impact webapp (une fois la table livrée)

- `server/api/contact.post.ts` : remplacer `persistContactSubmission` (CSV) par un `POST`
  vers `/projects/{projectId}/contact-messages`.
- Ajouter `locale` au payload (`ContactPayload` dans `shared/types/contact.ts`) et le
  transmettre depuis les formulaires.
- Conserver l'ordre actuel : **validation → persistance API → envoi email**.
- Le CSV existant peut servir d'**import initial** (colonnes déjà alignées).

## Contrat partagé

Déclarer le DTO dans `schemas/` (webapp) si un contrat partagé est attendu, comme pour les
autres ressources, afin que front et API partagent les mêmes bornes/types.
