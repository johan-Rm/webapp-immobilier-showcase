<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="h-0.5 w-full shrink-0 bg-[#6B7A4A]" />

    <div class="flex shrink-0 items-center gap-2 border-b border-white/10 py-2.5 pr-3 pl-4">
      <span
        class="shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider"
        style="color: #6b7a4a; background-color: rgba(255, 255, 255, 0.07)"
        :aria-label="hasGeneratedIdentifier ? 'Référence générée' : 'Référence en attente'"
      >
        {{ creatorDraft.identifier || 'REF' }}
      </span>
      <p class="min-w-0 flex-1 truncate text-sm font-semibold text-white/70">
        {{ creatorDraft.name || 'Nouveau bien immobilier' }}
      </p>
      <button
        type="button"
        class="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-[#8A9A5B] transition-colors hover:bg-[#6B7A4A]/15 hover:text-[#A4B872] disabled:cursor-not-allowed disabled:text-white/30 disabled:hover:bg-transparent disabled:hover:text-white/30"
        :disabled="!hasAnyInput"
        @click="showSummary"
      >
        <UIcon name="i-lucide-list-checks" class="text-sm" aria-hidden="true" />
        Résumé
      </button>
      <button
        type="button"
        class="rounded p-1 text-white/30 transition-colors hover:text-white/70"
        aria-label="Fermer la création"
        @click="handleClose"
      >
        <UIcon name="i-lucide-x" class="text-sm" aria-hidden="true" />
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-hidden">
      <Transition :name="stepTransitionName" mode="out-in">
        <div
          :key="activeStep"
          class="h-full p-4"
          :class="[
            activeStep === 'summary' ? 'overflow-hidden' : 'overflow-y-auto',
            isStructuredStep ? 'flex flex-col' : 'flex items-center justify-center',
          ]"
        >
          <div
            class="w-full"
            :class="
              isStructuredStep
                ? [
                    'creator-step-layout mx-auto grid h-full min-h-full max-w-2xl transition-[grid-template-rows] duration-300 ease-out',
                    activeStep === 'media' && isMediaHeadlineCollapsed
                      ? 'grid-rows-[auto_0fr_minmax(0,1fr)]'
                      : 'grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]',
                  ]
                : 'max-w-md'
            "
          >
            <div class="text-center" :class="isStructuredStep ? 'contents' : 'mb-8'">
              <div class="creator-step-stepper flex shrink-0 justify-center gap-1.5">
                <button
                  v-for="step in steps"
                  :key="step.id"
                  type="button"
                  class="h-1.5 rounded-full transition-all"
                  :class="stepProgressClass(step.id)"
                  :disabled="getStepState(step.id) === 'locked'"
                  :aria-label="`Aller à l'étape ${step.label}`"
                  @click="goToStep(step.id)"
                />
              </div>
              <template v-if="activeStep === 'classification'">
                <div class="creator-step-typing flex min-h-0 items-center">
                  <div class="mx-auto min-h-[6lh] w-full max-w-2xl text-left">
                    <div
                      v-for="(line, index) in classificationHeadlineParts"
                      :key="index"
                      class="text-2xl leading-tight font-light text-white/95"
                    >
                      <span>{{ line.lead }}</span>
                      <span class="text-[#8A9A5B]">{{ line.accent }}</span>
                      <span
                        v-if="classificationCaretLineIndex === index && !isTypingDone"
                        class="creator-caret"
                        aria-hidden="true"
                        >▍</span
                      >
                    </div>

                    <div
                      v-if="hasClassificationSupportLine"
                      class="mt-6 h-0.5 w-24 bg-[#8A9A5B]"
                      aria-hidden="true"
                    />

                    <div
                      v-if="hasClassificationSupportLine"
                      class="mt-6 text-sm leading-relaxed font-light text-white/55"
                    >
                      {{ classificationSupportLine
                      }}<span
                        v-if="classificationCaretLineIndex === 2 && !isTypingDone"
                        class="creator-caret"
                        aria-hidden="true"
                        >▍</span
                      >
                    </div>
                  </div>
                </div>
              </template>
              <template v-else-if="isStructuredStep">
                <div class="creator-step-typing flex min-h-0 items-center overflow-hidden">
                  <div class="mx-auto min-h-[6lh] w-full max-w-2xl text-left">
                    <div
                      v-for="(part, index) in structuredHeadlineParts"
                      :key="index"
                      class="text-2xl leading-tight font-light text-white/95"
                    >
                      <span>{{ part.lead }}</span>
                      <span class="text-[#8A9A5B]">{{ part.accent }}</span>
                      <span
                        v-if="structuredCaretLineIndex === index && !isTypingDone"
                        class="creator-caret"
                        aria-hidden="true"
                        >▍</span
                      >
                    </div>

                    <div
                      v-if="hasStructuredSupportLine"
                      class="mt-6 h-0.5 w-24 bg-[#8A9A5B]"
                      aria-hidden="true"
                    />

                    <div
                      v-if="hasStructuredSupportLine"
                      class="mt-6 text-sm leading-relaxed font-light text-white/55"
                    >
                      {{ structuredSupportLine
                      }}<span
                        v-if="structuredCaretLineIndex === 2 && !isTypingDone"
                        class="creator-caret"
                        aria-hidden="true"
                        >▍</span
                      >
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <section
              v-if="activeStep === 'classification'"
              class="creator-step-fields flex min-h-0 items-start pb-6 text-center"
            >
              <div class="grid w-full grid-cols-1 gap-3 text-left">
                <Transition name="creator-reveal">
                  <DashboardCategoryCodeSelect
                    v-if="revealedSelects.listing"
                    in-code-set="real-estate-listing"
                    :model-value="creatorDraft.realEstateListing"
                    label="Type de listing"
                    placeholder="Choisir le type"
                    @update:model-value="updateStringField('realEstateListing', $event)"
                  />
                </Transition>
                <Transition name="creator-reveal">
                  <DashboardCategoryCodeSelect
                    v-if="revealedSelects.category"
                    in-code-set="accommodation-type"
                    :model-value="creatorDraft.category"
                    label="Catégorie"
                    placeholder="Choisir la catégorie"
                    @update:model-value="updateStringField('category', $event)"
                  />
                </Transition>
                <Transition name="creator-reveal">
                  <DashboardCategoryCodeSelect
                    v-if="revealedSelects.place"
                    in-code-set="accommodation-place"
                    :model-value="creatorDraft.place"
                    label="Lieu"
                    placeholder="Choisir le lieu"
                    @update:model-value="updateStringField('place', $event)"
                  />
                </Transition>
              </div>
            </section>

            <section
              v-else-if="activeStep === 'name'"
              class="creator-step-fields flex min-h-0 items-start pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <label
                  v-if="revealedNameInput"
                  class="relative block w-full overflow-hidden text-left"
                >
                  <input
                    v-model="creatorDraft.name"
                    type="text"
                    class="w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-lg font-semibold text-white/85 caret-[#6B7A4A] transition-colors outline-none focus:border-[#6B7A4A]"
                  />
                  <!-- Placeholder rotatif (slide vertical) : overlay, le placeholder natif ne s'anime pas. -->
                  <Transition name="creator-suggestion" mode="out-in">
                    <span
                      v-if="!creatorDraft.name"
                      :key="designationPlaceholder"
                      class="pointer-events-none absolute inset-x-0 top-2 truncate text-lg font-semibold text-white/20"
                    >
                      {{ designationPlaceholder }}
                    </span>
                  </Transition>
                </label>
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'price'"
              class="creator-step-fields flex min-h-0 items-start pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <div v-if="revealedPriceFields" class="grid w-full grid-cols-1 gap-3 text-left">
                  <div class="grid grid-cols-[minmax(0,1fr)_5rem] gap-3">
                    <div class="relative">
                      <input
                        :value="creatorDraft.price ?? ''"
                        type="number"
                        step="10000"
                        :disabled="creatorDraft.priceOnRequest"
                        class="creator-price-input w-full rounded border border-white/10 bg-white/5 py-3 pr-10 pl-3 text-sm text-white/80 caret-white transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]/60 disabled:text-white/20"
                        placeholder="Ex. 660000"
                        aria-label="Prix du bien"
                        @input="updatePrice"
                      />
                      <div
                        class="absolute top-1/2 right-2 flex -translate-y-1/2 flex-col"
                        aria-hidden="true"
                      >
                        <button
                          type="button"
                          tabindex="-1"
                          class="rounded px-1 text-[#8A9A5B] transition-colors hover:text-[#A4B872] disabled:text-white/15"
                          :disabled="creatorDraft.priceOnRequest"
                          @click="adjustPrice(10000)"
                        >
                          <UIcon name="i-lucide-chevron-up" class="text-sm" />
                        </button>
                        <button
                          type="button"
                          tabindex="-1"
                          class="rounded px-1 text-[#8A9A5B] transition-colors hover:text-[#A4B872] disabled:text-white/15"
                          :disabled="creatorDraft.priceOnRequest"
                          @click="adjustPrice(-10000)"
                        >
                          <UIcon name="i-lucide-chevron-down" class="text-sm" />
                        </button>
                      </div>
                    </div>

                    <input
                      :value="creatorDraft.priceCurrency"
                      type="text"
                      readonly
                      tabindex="-1"
                      class="w-full rounded border border-[#8A9A5B]/45 bg-white/[0.03] px-3 py-3 text-center text-sm font-semibold text-[#8A9A5B] outline-none"
                      aria-label="Devise fixée en dirham marocain"
                    />
                  </div>

                  <label class="flex items-center gap-3 rounded bg-white/5 px-3 py-2">
                    <input
                      v-model="creatorDraft.priceOnRequest"
                      type="checkbox"
                      class="creator-price-on-request-checkbox"
                    />
                    <span class="text-xs text-white/60">Prix sur demande</span>
                  </label>
                </div>
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'media'"
              class="creator-step-fields flex min-h-0 flex-col text-left"
            >
              <Transition name="creator-reveal">
                <div v-if="revealedMediaFields" class="flex min-h-0 flex-1 flex-col">
                  <div class="mt-2 flex shrink-0 justify-center">
                    <button
                      type="button"
                      class="flex items-center gap-1 rounded px-2 py-0.5 text-[0.6rem] text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
                      :aria-pressed="isMediaHeadlineCollapsed"
                      :aria-label="
                        isMediaHeadlineCollapsed ? 'Afficher le titre' : 'Agrandir la galerie'
                      "
                      @click="isMediaHeadlineCollapsed = !isMediaHeadlineCollapsed"
                    >
                      <UIcon
                        :name="
                          isMediaHeadlineCollapsed
                            ? 'i-lucide-chevrons-down'
                            : 'i-lucide-chevrons-up'
                        "
                        class="text-xs"
                        aria-hidden="true"
                      />
                      {{ isMediaHeadlineCollapsed ? 'Réduire' : 'Agrandir' }}
                    </button>
                  </div>
                  <DashboardPropertyMediaGallery
                    class="min-h-0 flex-1"
                    :associated-media="creatorDraft.associatedMedia"
                    @update:associated-media="updateAssociatedMedia"
                  />
                </div>
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'mediaAlt'"
              class="creator-step-fields flex min-h-0 items-start overflow-y-auto pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <DashboardPropertyAssociatedMediaEditor
                  v-if="revealedMediaAltFields"
                  :associated-media="creatorDraft.associatedMedia"
                  full-width-items
                  hide-add-button
                  @update:associated-media="updateAssociatedMedia"
                />
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'details'"
              class="creator-step-fields flex min-h-0 items-start overflow-y-auto pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <div v-if="revealedDetailsFields" class="w-full space-y-4 text-left">
                  <div class="grid grid-cols-2 gap-3">
                    <input
                      v-model="creatorDraft.floorSize"
                      type="text"
                      class="w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Surface habitable"
                      aria-label="Surface habitable"
                    />
                    <input
                      v-model="creatorDraft.areaSize"
                      type="text"
                      class="w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Surface totale"
                      aria-label="Surface totale"
                    />
                  </div>

                  <button
                    v-if="!showExtraDetails"
                    type="button"
                    class="flex items-center gap-1 text-xs text-[#8A9A5B] transition-colors hover:text-[#A4B872]"
                    @click="showExtraDetails = true"
                  >
                    <UIcon name="i-lucide-plus" class="text-xs" aria-hidden="true" />
                    Ajouter plus de détails
                  </button>

                  <div v-else class="grid grid-cols-2 gap-3">
                    <input
                      v-model="creatorDraft.landArea"
                      type="text"
                      class="w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Surface terrain"
                      aria-label="Surface terrain"
                    />
                    <input
                      v-model="creatorDraft.areaTerrace"
                      type="text"
                      class="w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Terrasse"
                      aria-label="Terrasse"
                    />
                    <input
                      :value="creatorDraft.numberOfRooms ?? ''"
                      type="number"
                      min="0"
                      class="creator-price-input w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Pièces"
                      aria-label="Nombre de pièces"
                      @input="updateNumberField('numberOfRooms', $event)"
                    />
                    <input
                      :value="creatorDraft.numberOfBedrooms ?? ''"
                      type="number"
                      min="0"
                      class="creator-price-input w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Chambres"
                      aria-label="Nombre de chambres"
                      @input="updateNumberField('numberOfBedrooms', $event)"
                    />
                    <input
                      :value="creatorDraft.numberOfBathroomsTotal ?? ''"
                      type="number"
                      min="0"
                      class="creator-price-input w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Salles de bain"
                      aria-label="Nombre de salles de bain"
                      @input="updateNumberField('numberOfBathroomsTotal', $event)"
                    />
                    <input
                      :value="creatorDraft.numberOfGarages ?? ''"
                      type="number"
                      min="0"
                      class="creator-price-input w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Garages"
                      aria-label="Nombre de garages"
                      @input="updateNumberField('numberOfGarages', $event)"
                    />
                    <input
                      :value="creatorDraft.occupancy ?? ''"
                      type="number"
                      min="0"
                      class="creator-price-input w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Capacité"
                      aria-label="Capacité d'accueil"
                      @input="updateNumberField('occupancy', $event)"
                    />
                    <input
                      :value="creatorDraft.yearBuilt ?? ''"
                      type="number"
                      min="0"
                      class="creator-price-input w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Année de construction"
                      aria-label="Année de construction"
                      @input="updateNumberField('yearBuilt', $event)"
                    />
                  </div>

                  <p class="text-xs text-white/30">
                    Rien ne presse : tu peux ignorer cette étape et compléter ces détails plus tard.
                  </p>
                </div>
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'description'"
              class="creator-step-fields flex min-h-0 items-start pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <textarea
                  v-if="revealedDescriptionFields"
                  v-model="creatorDraft.body"
                  rows="6"
                  class="w-full resize-none border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                  placeholder="Décris le bien, son ambiance, ses atouts…"
                  aria-label="Description du bien"
                />
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'comfort'"
              class="creator-step-fields flex min-h-0 items-start overflow-y-auto pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <div v-if="revealedComfortFields" class="grid w-full grid-cols-1 gap-3 text-left">
                  <DashboardCategoryCodeSelect
                    in-code-set="amenity-feature"
                    :model-value="creatorDraft.amenityFeature"
                    label="Équipements"
                    placeholder="Choisir les équipements"
                    multiple
                    :show-label="false"
                    @update:model-value="updateAmenityFeature"
                  />
                </div>
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'qualities'"
              class="creator-step-fields flex min-h-0 items-start overflow-y-auto pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <div v-if="revealedQualitiesFields" class="grid w-full grid-cols-2 gap-3 text-left">
                  <DashboardQualitiesEditor
                    :model-value="creatorDraft.qualities"
                    @update:model-value="updateQualities"
                  />
                </div>
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'optional'"
              class="creator-step-fields flex min-h-0 items-start pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <textarea
                  v-if="revealedOptionalFields"
                  v-model="creatorDraft.review"
                  rows="4"
                  class="w-full resize-none border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                  placeholder="Ce qui rend ce bien intéressant…"
                  aria-label="Notre avis"
                />
              </Transition>
            </section>

            <section
              v-else-if="activeStep === 'seo'"
              class="creator-step-fields flex min-h-0 items-start overflow-y-auto pb-6 text-center"
            >
              <Transition name="creator-reveal">
                <div v-if="revealedSeoFields" class="w-full space-y-4 text-left">
                  <label class="block">
                    <span
                      class="mb-1 block text-[0.6rem] font-semibold tracking-widest text-white/30 uppercase"
                      >Titre SEO</span
                    >
                    <input
                      v-model="creatorDraft.metaTitle"
                      type="text"
                      class="w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Titre pour les moteurs de recherche"
                      aria-label="Titre SEO"
                    />
                  </label>
                  <label class="block">
                    <span
                      class="mb-1 block text-[0.6rem] font-semibold tracking-widest text-white/30 uppercase"
                      >Description SEO</span
                    >
                    <textarea
                      v-model="creatorDraft.metaDescription"
                      rows="3"
                      class="w-full resize-none border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]"
                      placeholder="Description courte pour les moteurs de recherche"
                      aria-label="Description SEO"
                    />
                  </label>
                </div>
              </Transition>
            </section>

            <section
              v-else
              class="creator-step-fields flex min-h-0 items-start overflow-hidden pb-6 text-center"
            >
              <div v-if="revealedSummaryContent" class="flex h-full min-h-0 w-full flex-col gap-6">
                <div
                  v-if="canFinalizeDraft"
                  class="shrink-0 rounded border border-[#6B7A4A]/35 bg-[#6B7A4A]/10 px-3 py-2 text-xs text-white/70"
                >
                  Très bien, la fiche contient assez d’informations pour enregistrer le bien.
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto">
                  <table class="w-full table-fixed text-xs">
                    <tbody>
                      <tr v-for="item in summaryItems" :key="item.label">
                        <th class="w-32 py-1 pr-4 text-right font-normal text-white/30">
                          {{ item.label }}
                        </th>
                        <td class="py-1 text-left text-white/65">
                          {{ item.value }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Transition>
    </div>

    <div class="shrink-0 border-t border-white/10 bg-[#1a1a1a] px-4 py-3">
      <p v-if="readyMessage" class="mb-2 text-xs text-[#6B7A4A]">{{ readyMessage }}</p>

      <!-- Navigation standard entre étapes -->
      <div class="flex items-center gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          :disabled="activeStepIndex === 0"
          class="text-white/45 hover:bg-white/10 hover:text-white"
          @click="goPrevious"
        >
          Retour
        </UButton>

        <UButton
          v-if="currentStep.optional"
          type="button"
          color="neutral"
          variant="ghost"
          class="text-white/45 hover:bg-white/10 hover:text-white"
          @click="skipCurrentStep"
        >
          Ignorer
        </UButton>

        <UButton
          type="button"
          block
          class="font-medium"
          :disabled="isCreatingDraft || isFinalizing"
          :loading="isCreatingDraft || isFinalizing"
          :class="['bg-[#6B7A4A]! hover:bg-[#5c6940]!']"
          @click="handlePrimaryAction"
        >
          {{ primaryActionLabel }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  DashboardAccommodationPreview,
  DashboardAccommodationSavePayload,
  DashboardEditableRecord,
  DashboardEditableValue,
} from '#shared/types/dashboardAccommodation'

import { useDashboardSave } from '~/composables/dashboard/useDashboardSave'
import { useDesignationPlaceholder } from '~/composables/dashboard/useDesignationPlaceholder'

type CreatorStepId =
  | 'classification'
  | 'name'
  | 'price'
  | 'media'
  | 'mediaAlt'
  | 'details'
  | 'description'
  | 'comfort'
  | 'qualities'
  | 'optional'
  | 'seo'
  | 'summary'
type CreatorStepState = 'locked' | 'current' | 'completed' | 'skipped' | 'invalid'

type CreatorStep = {
  id: CreatorStepId
  label: string
  icon: string
  optional?: boolean
}

type CreatorMediaItem = {
  image: string
  caption: string
  keywords: string[]
  representativeOfPage: boolean
}

type CreatorDraft = {
  identifier: string
  slug: string
  realEstateListing: string
  category: string
  place: string
  name: string
  price: number | null
  priceCurrency: string
  priceOnRequest: boolean
  associatedMedia: CreatorMediaItem[]
  floorSize: string
  areaSize: string
  landArea: string
  areaTerrace: string
  numberOfBedrooms: number | null
  numberOfRooms: number | null
  numberOfBathroomsTotal: number | null
  numberOfGarages: number | null
  occupancy: number | null
  yearBuilt: number | null
  body: string
  amenityFeature: string[]
  qualities: DashboardEditableValue
  metaTitle: string
  metaDescription: string
  review: string
}

type CreatorDraftResponse = {
  identifier: string
  slug: string | null
  iri: string | null
}

defineOptions({ name: 'DashboardPropertyCreatorPanel' })

const emit = defineEmits<{
  close: []
  'draft-created': [identifier: string]
  created: [identifier: string]
}>()

const steps: CreatorStep[] = [
  { id: 'classification', label: 'Départ', icon: 'i-lucide-tags' },
  { id: 'name', label: 'Désignation', icon: 'i-lucide-type' },
  { id: 'price', label: 'Prix', icon: 'i-lucide-badge-dollar-sign' },
  { id: 'media', label: 'Image', icon: 'i-lucide-image' },
  { id: 'mediaAlt', label: 'Textes alt', icon: 'i-lucide-text-cursor-input' },
  { id: 'details', label: 'Détails', icon: 'i-lucide-ruler', optional: true },
  { id: 'description', label: 'Description', icon: 'i-lucide-align-left' },
  { id: 'comfort', label: 'Confort', icon: 'i-lucide-armchair', optional: true },
  { id: 'qualities', label: 'Qualités', icon: 'i-lucide-sliders-horizontal', optional: true },
  { id: 'optional', label: 'Avis', icon: 'i-lucide-sparkles', optional: true },
  { id: 'seo', label: 'SEO', icon: 'i-lucide-search', optional: true },
  { id: 'summary', label: 'Résumé', icon: 'i-lucide-check-circle' },
]

const creatorDraft = reactive<CreatorDraft>({
  identifier: '',
  slug: '',
  realEstateListing: '',
  category: '',
  place: '',
  name: '',
  price: null,
  priceCurrency: 'MAD',
  priceOnRequest: false,
  associatedMedia: [],
  floorSize: '',
  areaSize: '',
  landArea: '',
  areaTerrace: '',
  numberOfBedrooms: null,
  numberOfRooms: null,
  numberOfBathroomsTotal: null,
  numberOfGarages: null,
  occupancy: null,
  yearBuilt: null,
  body: '',
  amenityFeature: [],
  qualities: [],
  metaTitle: '',
  metaDescription: '',
  review: '',
})

const activeStep = ref<CreatorStepId>('classification')
const skippedSteps = ref<Set<CreatorStepId>>(new Set())
const readyMessage = ref<string | null>(null)
const isCreatingDraft = ref(false)
const isFinalizing = ref(false)
const isFinalized = ref(false)
const stepTransitionName = ref<'creator-step-forward' | 'creator-step-backward'>(
  'creator-step-forward',
)
const displayedAssistantMessage = ref<string>('')
const isTypingDone = ref<boolean>(false)
const revealedSelects = reactive<Record<CreatorSelectKey, boolean>>({
  listing: false,
  category: false,
  place: false,
})
const revealedNameInput = ref(false)
const revealedPriceFields = ref(false)
const revealedMediaFields = ref(false)
const isMediaHeadlineCollapsed = ref(false)
const revealedMediaAltFields = ref(false)
const revealedDetailsFields = ref(false)
const revealedDescriptionFields = ref(false)
const revealedComfortFields = ref(false)
const revealedQualitiesFields = ref(false)
const revealedOptionalFields = ref(false)
const revealedSeoFields = ref(false)
const revealedSummaryContent = ref(false)
// Détails optionnels masqués au départ (révélés à la demande).
const showExtraDetails = ref(false)
let typingTimer: ReturnType<typeof setTimeout> | null = null
// Steps dont l'effet typing a déjà joué : au retour, le texte s'affiche sans animation.
const typedSteps = new Set<CreatorStepId>()

const activeStepIndex = computed<number>(() =>
  steps.findIndex((step) => step.id === activeStep.value),
)
const currentStep = computed<CreatorStep>(() => steps[activeStepIndex.value] ?? steps[0]!)
const metadataStore = useMetadataStore()
const { localeSetting } = useLang()
const { errorMessage: saveErrorMessage, saveMultilingual } = useDashboardSave()
const toast = useToast()

// Libellé du lieu choisi (code -> label) pour les suggestions contextuelles.
const placeLabel = computed<string>(
  () =>
    metadataStore
      .getOptionsForCodeSet('accommodation-place')
      .find((option) => option.value === creatorDraft.place)?.label ?? '',
)

// Rotation suspendue dès qu'une désignation est saisie (placeholder alors masqué).
const isDesignationActive = computed<boolean>(
  () => activeStep.value === 'name' && !creatorDraft.name.trim(),
)

const { placeholder: designationPlaceholder } = useDesignationPlaceholder({
  placeLabel,
  active: isDesignationActive,
})
const isStructuredStep = computed<boolean>(
  () =>
    activeStep.value === 'classification' ||
    activeStep.value === 'name' ||
    activeStep.value === 'price' ||
    activeStep.value === 'media' ||
    activeStep.value === 'mediaAlt' ||
    activeStep.value === 'details' ||
    activeStep.value === 'description' ||
    activeStep.value === 'comfort' ||
    activeStep.value === 'qualities' ||
    activeStep.value === 'optional' ||
    activeStep.value === 'seo' ||
    activeStep.value === 'summary',
)

const assistantMessage = computed<string>(() => {
  const messages: Record<CreatorStepId, string> = {
    classification:
      'Commençons tranquillement. Choisis le type, la catégorie et le lieu. Je m’occupe de préparer la référence.',
    name: 'Poursuivons tranquillement. Donne au bien une désignation courte. Je m’en sers comme repère et je m’occupe du SEO.',
    price:
      'Passons au prix. Indique le prix du bien si tu l’as. Sinon je l’affiche en « prix sur demande », sans bloquer la création.',
    media:
      'Occupons-nous des images. Ajoute une ou plusieurs images du bien. Je m’occupe de l’affichage et de la mise en avant de l’image principale.',
    mediaAlt:
      'Soignons les descriptions. Décris brièvement chaque image. Je m’en sers pour l’accessibilité et le référencement de la fiche.',
    details:
      'Précisons quelques détails. Renseigne au moins une surface. Je te laisse compléter le reste plus tard dans l’éditeur.',
    description:
      'Ajoutons une description. Décris le bien en quelques lignes. Je m’en sers pour enrichir la fiche et son référencement.',
    comfort:
      'Passons au confort. Sélectionne les équipements présents. Je les afficherai comme points forts de la fiche.',
    qualities:
      'Évaluons les qualités. Note le bien sur quelques critères. Je les mets en valeur sous forme de repères visuels.',
    optional:
      'Ajoutons une touche en plus. Partage le regard de l’agence sur ce bien. Je le mets en valeur sur la fiche.',
    seo: 'Occupons-nous du référencement. Vérifie le titre et la description proposés. Je les ai préremplis depuis la désignation et la description.',
    summary:
      'Faisons le point ensemble. Jette un dernier coup d’œil au récapitulatif. Je m’occupe de créer le bien dès que tu valides.',
  }

  return messages[activeStep.value]
})

type CreatorSelectKey = 'listing' | 'category' | 'place'
type CreatorRevealKey =
  | CreatorSelectKey
  | 'nameInput'
  | 'priceFields'
  | 'mediaFields'
  | 'mediaAltFields'
  | 'detailsFields'
  | 'descriptionFields'
  | 'comfortFields'
  | 'qualitiesFields'
  | 'optionalFields'
  | 'seoFields'
  | 'summaryContent'

type AssistantSegment = {
  text: string
  newLine?: boolean
  delayBefore?: number
  reveal?: CreatorRevealKey
  revealDelay?: number
  pauseAfter?: number
}

const SEGMENT_PAUSE_MS = 500
const CLASSIFICATION_ACCENT_STARTS = ['tranquillement', 'le type'] as const

const buildConversation = (stepId: CreatorStepId): AssistantSegment[] => {
  if (stepId === 'classification') {
    return [
      { text: 'Commençons tranquillement.' },
      {
        text: 'Choisis le type',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'listing',
        revealDelay: 260,
        pauseAfter: 380,
      },
      { text: ', la catégorie', reveal: 'category', revealDelay: 220, pauseAfter: 360 },
      { text: ' et le lieu.', reveal: 'place', revealDelay: 220, pauseAfter: 420 },
      { text: 'Je m’occupe de préparer la référence.', newLine: true },
    ]
  }

  if (stepId === 'name') {
    return [
      { text: 'Poursuivons tranquillement.' },
      {
        text: 'Donne au bien une désignation courte.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'nameInput',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je m’en sers comme repère et je m’occupe du SEO.', newLine: true },
    ]
  }

  if (stepId === 'price') {
    return [
      { text: 'Passons au prix.' },
      {
        text: 'Indique le prix du bien si tu l’as.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'priceFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      {
        text: 'Sinon je l’affiche en « prix sur demande », sans bloquer la création.',
        newLine: true,
      },
    ]
  }

  if (stepId === 'media') {
    return [
      { text: 'Occupons-nous des images.' },
      {
        text: 'Ajoute une ou plusieurs images du bien.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'mediaFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      {
        text: 'Je m’occupe de l’affichage et de la mise en avant de l’image principale.',
        newLine: true,
      },
    ]
  }

  if (stepId === 'mediaAlt') {
    return [
      { text: 'Soignons les descriptions.' },
      {
        text: 'Décris brièvement chaque image.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'mediaAltFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      {
        text: 'Je m’en sers pour l’accessibilité et le référencement de la fiche.',
        newLine: true,
      },
    ]
  }

  if (stepId === 'details') {
    return [
      { text: 'Précisons quelques détails.' },
      {
        text: 'Renseigne au moins une surface.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'detailsFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je te laisse compléter le reste plus tard dans l’éditeur.', newLine: true },
    ]
  }

  if (stepId === 'optional') {
    return [
      { text: 'Ajoutons une touche en plus.' },
      {
        text: 'Partage le regard de l’agence sur ce bien.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'optionalFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je le mets en valeur sur la fiche.', newLine: true },
    ]
  }

  if (stepId === 'description') {
    return [
      { text: 'Ajoutons une description.' },
      {
        text: 'Décris le bien en quelques lignes.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'descriptionFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je m’en sers pour enrichir la fiche et son référencement.', newLine: true },
    ]
  }

  if (stepId === 'comfort') {
    return [
      { text: 'Passons au confort.' },
      {
        text: 'Sélectionne les équipements présents.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'comfortFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je les afficherai comme points forts de la fiche.', newLine: true },
    ]
  }

  if (stepId === 'qualities') {
    return [
      { text: 'Évaluons les qualités.' },
      {
        text: 'Note le bien sur quelques critères.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'qualitiesFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je les mets en valeur sous forme de repères visuels.', newLine: true },
    ]
  }

  if (stepId === 'seo') {
    return [
      { text: 'Occupons-nous du référencement.' },
      {
        text: 'Vérifie le titre et la description proposés.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'seoFields',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je les ai préremplis depuis la désignation et la description.', newLine: true },
    ]
  }

  if (stepId === 'summary') {
    return [
      { text: 'Faisons le point ensemble.' },
      {
        text: 'Jette un dernier coup d’œil au récapitulatif.',
        newLine: true,
        delayBefore: SEGMENT_PAUSE_MS,
        reveal: 'summaryContent',
        revealDelay: 260,
        pauseAfter: 420,
      },
      { text: 'Je m’occupe de créer le bien dès que tu valides.', newLine: true },
    ]
  }

  return [{ text: assistantMessage.value }]
}

const hasGeneratedIdentifier = computed<boolean>(() => Boolean(creatorDraft.identifier.trim()))

const classificationMessageLines = computed<string[]>(() =>
  displayedAssistantMessage.value.split('\n'),
)

const classificationHeadlineParts = computed<Array<{ lead: string; accent: string }>>(() =>
  classificationMessageLines.value.slice(0, 2).map((line, index) => {
    const accentStart = CLASSIFICATION_ACCENT_STARTS[index]
    const accentIndex = accentStart ? line.indexOf(accentStart) : -1
    if (accentIndex === -1) return { lead: line, accent: '' }

    return {
      lead: line.slice(0, accentIndex),
      accent: line.slice(accentIndex),
    }
  }),
)

const hasClassificationSupportLine = computed<boolean>(
  () => classificationMessageLines.value.length > 2,
)

const classificationSupportLine = computed<string>(() => classificationMessageLines.value[2] ?? '')

const classificationCaretLineIndex = computed<number>(() =>
  Math.max(0, classificationMessageLines.value.length - 1),
)

const structuredMessageLines = computed<string[]>(() => displayedAssistantMessage.value.split('\n'))

// Patron 3 temps : 2 lignes de titre (amorce + consigne) puis l'engagement en support.
const structuredHeadlineLines = computed<string[]>(() => structuredMessageLines.value.slice(0, 2))

// Mise en avant olive : le premier mot (le verbe) reste blanc, le reste passe en accent,
// comme la classification.
const splitHeadlineAccent = (line: string): { lead: string; accent: string } => {
  const spaceIndex = line.indexOf(' ')
  if (spaceIndex === -1) return { lead: line, accent: '' }
  return { lead: line.slice(0, spaceIndex + 1), accent: line.slice(spaceIndex + 1) }
}

const structuredHeadlineParts = computed<Array<{ lead: string; accent: string }>>(() =>
  structuredHeadlineLines.value.map(splitHeadlineAccent),
)

const hasStructuredSupportLine = computed<boolean>(() => structuredMessageLines.value.length > 2)

const structuredSupportLine = computed<string>(() => structuredMessageLines.value[2] ?? '')

const structuredCaretLineIndex = computed<number>(() =>
  Math.max(0, structuredMessageLines.value.length - 1),
)

const hasAnyInput = computed<boolean>(() =>
  Boolean(
    creatorDraft.realEstateListing ||
    creatorDraft.category ||
    creatorDraft.place ||
    creatorDraft.name.trim() ||
    creatorDraft.priceOnRequest ||
    creatorDraft.price !== null ||
    creatorDraft.associatedMedia.length > 0 ||
    creatorDraft.floorSize.trim() ||
    creatorDraft.areaSize.trim() ||
    creatorDraft.body.trim() ||
    creatorDraft.amenityFeature.length > 0 ||
    creatorDraft.review.trim(),
  ),
)

const hasClassification = computed<boolean>(() =>
  Boolean(creatorDraft.realEstateListing && creatorDraft.category && creatorDraft.place),
)

const hasName = computed<boolean>(() => Boolean(creatorDraft.name.trim()))

const hasPrice = computed<boolean>(() => creatorDraft.priceOnRequest || creatorDraft.price !== null)

const hasRepresentativeImage = computed<boolean>(() =>
  creatorDraft.associatedMedia.some((item) => item.representativeOfPage),
)

const hasMediaAlt = computed<boolean>(
  () =>
    creatorDraft.associatedMedia.length > 0 &&
    creatorDraft.associatedMedia.every((item) => item.caption.trim()),
)

const hasSurface = computed<boolean>(() =>
  Boolean(creatorDraft.floorSize.trim() || creatorDraft.areaSize.trim()),
)

// La description alimente le metaDescription (SEO) : elle est requise.
const hasBody = computed<boolean>(() => Boolean(creatorDraft.body.trim()))

const canFinalizeDraft = computed<boolean>(
  () =>
    hasClassification.value &&
    hasName.value &&
    hasPrice.value &&
    hasRepresentativeImage.value &&
    hasMediaAlt.value &&
    hasSurface.value &&
    hasBody.value,
)

const primaryActionLabel = computed<string>(() => {
  if (activeStep.value !== 'summary') return 'Continuer'
  return 'Valider et enregistrer'
})

const summaryItems = computed<Array<{ label: string; value: string }>>(() => {
  const amenityCount = creatorDraft.amenityFeature.length
  // Variable `unknown` intermédiaire : `Array.isArray` sur le type récursif
  // DashboardEditableValue fait exploser l'instanciation de types (TS2589).
  const qualitiesValue: unknown = creatorDraft.qualities
  const qualitiesCount = Array.isArray(qualitiesValue) ? qualitiesValue.length : 0
  const seoReady = Boolean(creatorDraft.metaTitle.trim() || creatorDraft.metaDescription.trim())

  return [
    { label: 'Type', value: creatorDraft.realEstateListing || 'À choisir' },
    { label: 'Catégorie', value: creatorDraft.category || 'À choisir' },
    { label: 'Lieu', value: creatorDraft.place || 'À choisir' },
    { label: 'Désignation', value: creatorDraft.name || 'À renseigner' },
    { label: 'Prix', value: creatorDraft.priceOnRequest ? 'Prix sur demande' : formatPrice() },
    { label: 'Images', value: `${creatorDraft.associatedMedia.length} image(s)` },
    { label: 'Textes alt', value: hasMediaAlt.value ? 'Complétés' : 'À compléter' },
    { label: 'Surface', value: creatorDraft.floorSize || creatorDraft.areaSize || 'À renseigner' },
    { label: 'Description', value: creatorDraft.body.trim() ? 'Complétée' : 'À compléter' },
    { label: 'Confort', value: amenityCount ? `${amenityCount} équipement(s)` : '—' },
    { label: 'Qualités', value: qualitiesCount ? 'Renseignées' : '—' },
    { label: 'SEO', value: seoReady ? 'Préparé' : 'Auto' },
  ]
})

const getStepRequirement = (stepId: CreatorStepId): boolean => {
  switch (stepId) {
    case 'classification':
      return hasClassification.value
    case 'name':
      return hasName.value
    case 'price':
      return hasPrice.value
    case 'media':
      return hasRepresentativeImage.value
    case 'mediaAlt':
      return hasMediaAlt.value
    case 'details':
      return hasSurface.value
    case 'description':
      return hasBody.value
    case 'comfort':
    case 'qualities':
    case 'optional':
    case 'seo':
      return true
    case 'summary':
      return canFinalizeDraft.value
  }
}

const canAccessStep = (stepId: CreatorStepId): boolean => {
  if (stepId === 'summary') return true

  const targetIndex = steps.findIndex((step) => step.id === stepId)
  if (targetIndex <= activeStepIndex.value) return true

  return steps.slice(0, targetIndex).every((step) => step.optional || getStepRequirement(step.id))
}

const getStepState = (stepId: CreatorStepId): CreatorStepState => {
  if (stepId === activeStep.value) return 'current'
  if (!canAccessStep(stepId)) return 'locked'
  if (skippedSteps.value.has(stepId)) return 'skipped'
  return getStepRequirement(stepId) ? 'completed' : 'invalid'
}

const stepProgressClass = (stepId: CreatorStepId): string => {
  const state = getStepState(stepId)
  if (state === 'current') return 'w-8 bg-[#6B7A4A]'
  if (state === 'completed') return 'w-4 bg-[#6B7A4A]/60'
  if (state === 'skipped') return 'w-4 bg-white/20'
  if (state === 'invalid') return 'w-4 bg-white/25 hover:bg-white/35'
  return 'w-4 cursor-not-allowed bg-white/10'
}

const formatPrice = (): string => {
  if (creatorDraft.price === null) return 'À renseigner'
  return `${creatorDraft.price.toLocaleString('fr-FR')} ${creatorDraft.priceCurrency || 'MAD'}`
}

const createDraftAccommodation = async (): Promise<boolean> => {
  if (hasGeneratedIdentifier.value) return true

  isCreatingDraft.value = true
  clearReadyMessage()

  try {
    // Les relations sont envoyées en codes (codeValue) : le backend les résout
    // (ProjectScopedRelationDenormalizer). Pas d'IRI côté client.
    const result = await $fetch<CreatorDraftResponse>('/api/dashboard/accommodations/creator', {
      method: 'POST',
      body: {
        category: creatorDraft.category,
        realEstateListing: creatorDraft.realEstateListing,
        place: creatorDraft.place,
        locale: localeSetting.value,
      },
    })

    creatorDraft.identifier = result.identifier
    if (result.slug) creatorDraft.slug = result.slug
    emit('draft-created', result.identifier)
    toast.add({
      title: 'Brouillon créé',
      icon: 'i-lucide-badge-check',
      color: 'success',
    })
    return true
  } catch (error: unknown) {
    setStepError(error instanceof Error ? error.message : 'Création de la référence impossible.')
    return false
  } finally {
    isCreatingDraft.value = false
  }
}

const createPayload = (): DashboardEditableRecord => ({
  realEstateListing: creatorDraft.realEstateListing,
  category: creatorDraft.category,
  place: creatorDraft.place,
  name: creatorDraft.name,
  isActive: true,
  offer: {
    price: creatorDraft.priceOnRequest ? null : creatorDraft.price,
    priceCurrency: creatorDraft.priceCurrency,
    priceSpecification: creatorDraft.priceOnRequest ? 'prix-sur-demande' : null,
  },
  associatedMedia: creatorDraft.associatedMedia,
  floorSize: creatorDraft.floorSize || null,
  areaSize: creatorDraft.areaSize || null,
  landArea: creatorDraft.landArea || null,
  areaTerrace: creatorDraft.areaTerrace || null,
  numberOfBedrooms: creatorDraft.numberOfBedrooms,
  numberOfRooms: creatorDraft.numberOfRooms,
  numberOfBathroomsTotal: creatorDraft.numberOfBathroomsTotal,
  numberOfGarages: creatorDraft.numberOfGarages,
  occupancy: creatorDraft.occupancy,
  yearBuilt: creatorDraft.yearBuilt,
  amenityFeature: creatorDraft.amenityFeature,
  qualities: creatorDraft.qualities,
  metaTitle: creatorDraft.metaTitle || null,
  metaDescription: creatorDraft.metaDescription || null,
  review: creatorDraft.review || null,
})

// Preview minimale : non lue par la route PUT (seul le frontmatter sert au mapping),
// mais requise par le type DashboardAccommodationSavePayload. La preview réelle est
// renvoyée par le backend (freshAccommodation) après l'enregistrement.
const buildCreatorPreview = (): DashboardAccommodationPreview => ({
  identifier: creatorDraft.identifier,
  slug: creatorDraft.slug,
  title: creatorDraft.name,
  description: '',
  price: creatorDraft.price,
  priceCurrency: creatorDraft.priceCurrency,
  priceSpecification: creatorDraft.priceOnRequest ? 'prix-sur-demande' : '',
  placeSlug: creatorDraft.place,
  placeLabel: '',
  categorySlug: creatorDraft.category,
  categoryLabel: '',
  listingSlug: creatorDraft.realEstateListing,
  listingLabel: '',
  isActive: true,
  floorSize: creatorDraft.floorSize || null,
  landArea: null,
  numberOfRooms: null,
  numberOfBedrooms: null,
  numberOfBathroomsTotal: null,
  primaryImageUrl: '',
  media: [],
})

const buildSavePayload = (): DashboardAccommodationSavePayload => {
  const frontmatter = createPayload()
  frontmatter.isActive = true
  if (creatorDraft.slug) frontmatter.slug = creatorDraft.slug
  return {
    locale: localeSetting.value,
    fileName: '',
    slug: creatorDraft.slug,
    identifier: creatorDraft.identifier,
    frontmatter,
    body: creatorDraft.body,
    preview: buildCreatorPreview(),
  }
}

const finishToEdit = (): void => {
  emit('created', creatorDraft.identifier)
}

// Enregistre en une fois sur le brouillon les étapes accumulées (nom, prix, médias,
// détails) via la route de sauvegarde existante. Le bien est actif par défaut.
const finalizeDraft = async (): Promise<boolean> => {
  if (!hasGeneratedIdentifier.value) return false

  isFinalizing.value = true
  clearReadyMessage()

  const ok = await saveMultilingual(buildSavePayload(), localeSetting.value)
  isFinalizing.value = false

  if (!ok) {
    setStepError(saveErrorMessage.value ?? 'Enregistrement du bien impossible.')
    return false
  }

  isFinalized.value = true
  toast.add({
    title: 'Bien enregistré',
    icon: 'i-lucide-save',
    color: 'success',
  })
  return true
}

const setStepError = (message: string): void => {
  toast.add({
    title: message,
    icon: 'i-lucide-alert-triangle',
    color: 'error',
  })
}

const clearReadyMessage = (): void => {
  readyMessage.value = null
}

const validateCurrentStep = (): boolean => {
  if (currentStep.value.optional) return true
  if (getStepRequirement(currentStep.value.id)) return true

  const messages: Record<CreatorStepId, string> = {
    classification: 'Choisissez un type, une catégorie et un lieu.',
    name: 'Ajoutez une désignation pour le bien.',
    price: 'Veuillez indiquer un prix.',
    media: 'Ajoutez au moins une image principale.',
    mediaAlt: 'Complétez le texte alt de chaque image.',
    details: 'Renseignez au moins une surface.',
    description: 'Ajoutez une description du bien.',
    comfort: '',
    qualities: '',
    optional: '',
    seo: '',
    summary: 'La fiche doit être complète avant création.',
  }
  setStepError(messages[currentStep.value.id])
  return false
}

const goToStep = (stepId: CreatorStepId): void => {
  if (isFinalized.value) return
  if (!canAccessStep(stepId)) return
  setActiveStep(stepId)
  clearReadyMessage()
}

const goNext = (): void => {
  const nextStep = steps[activeStepIndex.value + 1]
  if (!nextStep) return
  setActiveStep(nextStep.id)
  clearReadyMessage()
}

const goPrevious = (): void => {
  const previousStep = steps[activeStepIndex.value - 1]
  if (!previousStep) return
  setActiveStep(previousStep.id)
  clearReadyMessage()
}

const skipCurrentStep = (): void => {
  skippedSteps.value = new Set([...skippedSteps.value, currentStep.value.id])
  goNext()
}

const showSummary = (): void => {
  goToStep('summary')
}

const handleClose = (): void => {
  emit('close')
}

const handlePrimaryAction = async (): Promise<void> => {
  if (!validateCurrentStep()) return
  if (activeStep.value === 'classification') {
    const created = await createDraftAccommodation()
    if (!created) return
    goNext()
    return
  }
  if (activeStep.value === 'summary') {
    const finalized = await finalizeDraft()
    if (!finalized) return
    finishToEdit()
    return
  }
  goNext()
}

const setActiveStep = (stepId: CreatorStepId): void => {
  const nextIndex = steps.findIndex((step) => step.id === stepId)
  stepTransitionName.value =
    nextIndex < activeStepIndex.value ? 'creator-step-backward' : 'creator-step-forward'
  activeStep.value = stepId
}

const stopTyping = (): void => {
  if (typingTimer === null) return
  clearTimeout(typingTimer)
  typingTimer = null
}

const revealField = (revealKey: CreatorRevealKey): void => {
  if (revealKey === 'nameInput') revealedNameInput.value = true
  else if (revealKey === 'priceFields') revealedPriceFields.value = true
  else if (revealKey === 'mediaFields') revealedMediaFields.value = true
  else if (revealKey === 'mediaAltFields') revealedMediaAltFields.value = true
  else if (revealKey === 'detailsFields') revealedDetailsFields.value = true
  else if (revealKey === 'descriptionFields') revealedDescriptionFields.value = true
  else if (revealKey === 'comfortFields') revealedComfortFields.value = true
  else if (revealKey === 'qualitiesFields') revealedQualitiesFields.value = true
  else if (revealKey === 'optionalFields') revealedOptionalFields.value = true
  else if (revealKey === 'seoFields') revealedSeoFields.value = true
  else if (revealKey === 'summaryContent') revealedSummaryContent.value = true
  else revealedSelects[revealKey] = true
}

const resetReveals = (): void => {
  revealedSelects.listing = false
  revealedSelects.category = false
  revealedSelects.place = false
  revealedNameInput.value = false
  revealedPriceFields.value = false
  revealedMediaFields.value = false
  revealedMediaAltFields.value = false
  revealedDetailsFields.value = false
  revealedDescriptionFields.value = false
  revealedComfortFields.value = false
  revealedQualitiesFields.value = false
  revealedOptionalFields.value = false
  revealedSeoFields.value = false
  revealedSummaryContent.value = false
}

const scheduleNextSegment = (segment: AssistantSegment, runNext: () => void): void => {
  if (!segment.reveal) {
    runNext()
    return
  }
  const revealKey = segment.reveal
  typingTimer = setTimeout(() => {
    revealField(revealKey)
    typingTimer = setTimeout(runNext, segment.pauseAfter ?? 0)
  }, segment.revealDelay ?? 0)
}

const runConversation = (segments: AssistantSegment[], segmentIndex: number): void => {
  const segment = segments[segmentIndex]
  if (!segment) {
    typingTimer = null
    isTypingDone.value = true
    return
  }

  if (segment.newLine) displayedAssistantMessage.value += '\n'
  const base = displayedAssistantMessage.value
  const advance = (): void => runConversation(segments, segmentIndex + 1)

  const typeCharacter = (charIndex: number): void => {
    displayedAssistantMessage.value = base + segment.text.slice(0, charIndex)
    if (charIndex >= segment.text.length) {
      scheduleNextSegment(segment, advance)
      return
    }
    typingTimer = setTimeout(() => typeCharacter(charIndex + 1), 18)
  }

  if (segment.delayBefore) {
    typingTimer = setTimeout(() => typeCharacter(1), segment.delayBefore)
  } else {
    typeCharacter(1)
  }
}

// Affichage immédiat (sans typing) : texte complet + champs révélés. Utilisé au retour
// sur un step déjà animé.
const renderConversationInstant = (segments: AssistantSegment[]): void => {
  let message = ''
  segments.forEach((segment) => {
    if (segment.newLine) message += '\n'
    message += segment.text
    if (segment.reveal) revealField(segment.reveal)
  })
  displayedAssistantMessage.value = message
  isTypingDone.value = true
}

// SEO auto : pré-remplit titre/description depuis la désignation et le corps (modifiable).
const buildMetaDescription = (body: string): string => {
  const text = body.replace(/\s+/g, ' ').trim()
  return text.length > 160 ? `${text.slice(0, 157)}…` : text
}

const prefillSeo = (): void => {
  if (!creatorDraft.metaTitle.trim() && creatorDraft.name.trim()) {
    creatorDraft.metaTitle = creatorDraft.name.trim()
  }
  if (!creatorDraft.metaDescription.trim() && creatorDraft.body.trim()) {
    creatorDraft.metaDescription = buildMetaDescription(creatorDraft.body)
  }
}

const startTyping = (): void => {
  stopTyping()
  displayedAssistantMessage.value = ''
  isTypingDone.value = false
  resetReveals()

  if (activeStep.value === 'seo') prefillSeo()

  const segments = buildConversation(activeStep.value)

  // L'effet ne joue qu'une fois par step ; au retour, tout est affiché directement.
  if (typedSteps.has(activeStep.value)) {
    renderConversationInstant(segments)
    return
  }

  typedSteps.add(activeStep.value)
  runConversation(segments, 0)
}

const updateStringField = (
  field: 'realEstateListing' | 'category' | 'place',
  value: DashboardEditableValue,
): void => {
  creatorDraft[field] = typeof value === 'string' ? value : ''
  clearReadyMessage()
}

const updatePrice = (event: Event): void => {
  const raw = (event.target as HTMLInputElement).value
  const parsed = Number(raw)
  creatorDraft.price = raw === '' || !Number.isFinite(parsed) ? null : parsed
  clearReadyMessage()
}

type CreatorNumberField =
  | 'numberOfBedrooms'
  | 'numberOfRooms'
  | 'numberOfBathroomsTotal'
  | 'numberOfGarages'
  | 'occupancy'
  | 'yearBuilt'

const updateNumberField = (field: CreatorNumberField, event: Event): void => {
  const raw = (event.target as HTMLInputElement).value
  const parsed = Number(raw)
  creatorDraft[field] = raw === '' || !Number.isFinite(parsed) ? null : parsed
}

const updateAmenityFeature = (value: DashboardEditableValue): void => {
  creatorDraft.amenityFeature = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

const updateQualities = (value: DashboardEditableValue): void => {
  creatorDraft.qualities = value
}

const adjustPrice = (amount: number): void => {
  const currentPrice = creatorDraft.price ?? 0
  creatorDraft.price = Math.max(0, currentPrice + amount)
  clearReadyMessage()
}

const normalizeAssociatedMedia = (items: CreatorMediaItem[]): CreatorMediaItem[] => {
  if (items.length === 0) return []
  const hasRepresentative = items.some((item) => item.representativeOfPage)
  if (hasRepresentative) return items
  return items.map((item, index) => ({ ...item, representativeOfPage: index === 0 }))
}

const updateAssociatedMedia = (value: DashboardEditableValue): void => {
  if (!Array.isArray(value)) {
    creatorDraft.associatedMedia = []
    return
  }

  const items = value.flatMap((entry): CreatorMediaItem[] => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return []
    const record = entry as Record<string, DashboardEditableValue>
    const image = typeof record.image === 'string' ? record.image : ''
    if (!image) return []
    return [
      {
        image,
        caption: typeof record.caption === 'string' ? record.caption : '',
        keywords: Array.isArray(record.keywords)
          ? record.keywords.filter((keyword): keyword is string => typeof keyword === 'string')
          : [],
        representativeOfPage: record.representativeOfPage === true,
      },
    ]
  })

  creatorDraft.associatedMedia = normalizeAssociatedMedia(items)
  clearReadyMessage()
}

watch(activeStep, startTyping)

onMounted(startTyping)

onBeforeUnmount(stopTyping)
</script>

<style scoped>
.creator-step-forward-enter-active,
.creator-step-forward-leave-active,
.creator-step-backward-enter-active,
.creator-step-backward-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.creator-step-forward-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.creator-step-forward-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}

.creator-step-backward-enter-from {
  opacity: 0;
  transform: translateX(-1rem);
}

.creator-step-backward-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.creator-reveal-enter-active {
  transition:
    opacity 360ms ease,
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.creator-reveal-enter-from {
  opacity: 0;
  transform: translateY(0.85rem);
}

.creator-suggestion-enter-active,
.creator-suggestion-leave-active {
  transition:
    opacity 320ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.creator-suggestion-enter-from {
  opacity: 0;
  transform: translateY(0.6em);
}

.creator-suggestion-leave-to {
  opacity: 0;
  transform: translateY(-0.6em);
}

@media (prefers-reduced-motion: reduce) {
  .creator-suggestion-enter-active,
  .creator-suggestion-leave-active {
    transition: none;
  }
}

.creator-caret {
  display: inline-block;
  margin-left: 0.1em;
  color: #6b7a4a;
  font-weight: 400;
  animation: creator-caret-blink 900ms steps(1, end) infinite;
}

.creator-price-input {
  appearance: textfield;
}

.creator-price-input::-webkit-outer-spin-button,
.creator-price-input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.creator-price-on-request-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  flex: 0 0 auto;
  border: 1px solid rgb(255 255 255 / 0.35);
  border-radius: 0.125rem;
  appearance: none;
  background-color: transparent;
  display: grid;
  place-content: center;
  cursor: pointer;
}

.creator-price-on-request-checkbox::before {
  width: 0.55rem;
  height: 0.35rem;
  border-bottom: 2px solid white;
  border-left: 2px solid white;
  content: '';
  opacity: 0;
  transform: rotate(-45deg) translateY(-0.05rem);
}

.creator-price-on-request-checkbox:checked {
  border-color: #8a9a5b;
  background-color: #8a9a5b;
}

.creator-price-on-request-checkbox:checked::before {
  opacity: 1;
}

.creator-price-on-request-checkbox:focus-visible {
  outline: 2px solid rgb(138 154 91 / 0.7);
  outline-offset: 2px;
}

@keyframes creator-caret-blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}
</style>
