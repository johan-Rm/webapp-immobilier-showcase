import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import YAML, { isMap, isScalar, isSeq, type Document, type YAMLMap } from 'yaml'

import { toCamelCase, toSnakeCase } from '../../../shared/utils/case'
import { ensureReadableDirectory, ensureReadableFile, normalizePath } from '../../utils/fs'

type AdditionalPropertiesDefinition = {
  type: string
  properties?: SchemaNode
}

type SchemaField = {
  type: string
  properties?: SchemaNode
  additionalProperties?: AdditionalPropertiesDefinition
  required?: boolean
  comment?: string
}
type SchemaNode = Record<string, SchemaField>

type PropertyDefinition = { name: string; type: string; required?: boolean; comment?: string }

type ArtifactGenerationOptions = {
  outputDir?: string
  typeNameSuffix?: string
  fileNameSuffix?: string
}

type ResolvedArtifactContext = {
  knownSchemaMap?: Map<string, string>
  resolveTypeName: (schemaName: string) => string
  resolveFileName: (schemaName: string) => string
}

const FALLBACK_TYPE = 'Record<string, unknown>'

const PRIMITIVE_TYPE_MAP: Record<string, string> = {
  string: 'string',
  number: 'number',
  integer: 'number',
  boolean: 'boolean',
  null: 'null',
  undefined: 'undefined',
  date: 'string',
  datetime: 'string',
}

const SPECIAL_ALIASES: Record<string, string> = {
  url: 'string',
  URL: 'string',
}

const toPascalCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[\s_-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const splitUnionTypes = (value: string) =>
  value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)

const parseArrayType = (value: string) => {
  const trimmed = value.trim()
  const arrayMatch = trimmed.match(/^array<(.+)>$/i)
  if (arrayMatch) {
    const inner = arrayMatch[1]?.trim()
    if (!inner) {
      throw new Error('Type de tableau invalide : type interne manquant')
    }
    return { base: inner, isArray: true }
  }
  return { base: trimmed, isArray: false }
}

const isPrimitiveType = (value: string) =>
  Object.prototype.hasOwnProperty.call(PRIMITIVE_TYPE_MAP, value.toLowerCase())

const isAliasType = (value: string) =>
  Object.prototype.hasOwnProperty.call(SPECIAL_ALIASES, value) ||
  Object.prototype.hasOwnProperty.call(SPECIAL_ALIASES, value.toLowerCase())

const isObjectType = (value: string) => value.toLowerCase() === 'object'

const sanitizeComment = (value: string) => value.replace(/\*\//g, '* /').trim()

const formatJsDoc = (comment: string): string[] => {
  const lines = comment
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return []
  return ['  /**', ...lines.map((line) => `   * ${sanitizeComment(line)}`), '   */']
}

const getNodeComment = (node?: unknown): string | undefined => {
  if (!node || typeof node !== 'object') return undefined
  const candidate = node as { comment?: string | null; commentBefore?: string | null }
  const raw = candidate.commentBefore ?? candidate.comment ?? ''
  const trimmed = raw.trim()
  return trimmed.length ? trimmed : undefined
}

const getStringScalar = (node: unknown): string | null => {
  if (!isScalar(node)) return null
  return typeof node.value === 'string' ? node.value : null
}

const findMapEntry = (map: YAMLMap, key: string) =>
  map.items.find((item) => getStringScalar(item.key) === key)

const normalizeOutputDir = (outputDir?: string) => normalizePath(outputDir ?? 'schemas/interfaces')

const createArtifactContext = (
  schemas: readonly string[],
  knownSchemas?: readonly string[],
  options?: ArtifactGenerationOptions,
): ResolvedArtifactContext => {
  const resolveTypeName = (schemaName: string) => `${schemaName}${options?.typeNameSuffix ?? ''}`
  const resolveFileName = (schemaName: string) => `${schemaName}${options?.fileNameSuffix ?? ''}`
  const schemaMapSource = knownSchemas ?? schemas
  const knownSchemaMap = new Map(
    schemaMapSource.map((schemaName) => [schemaName, resolveTypeName(schemaName)]),
  )

  return { knownSchemaMap, resolveTypeName, resolveFileName }
}

const parseRequiredKeys = (map: YAMLMap, schemaName: string, context?: string): Set<string> => {
  const requiredEntry = findMapEntry(map, 'required')
  if (!requiredEntry) return new Set<string>()

  if (!isSeq(requiredEntry.value)) {
    throw new Error(
      `Propriété "${context ?? schemaName}" invalide dans le schéma "${schemaName}" (required doit être une liste)`,
    )
  }

  const values = requiredEntry.value.items.map((item, index) => {
    const value = getStringScalar(item)
    if (!value) {
      throw new Error(
        `Propriété "${context ?? schemaName}" invalide dans le schéma "${schemaName}" (required[${index}] doit être une chaîne)`,
      )
    }
    return value
  })

  return new Set(values)
}

const parseSchemaMap = (
  map: YAMLMap,
  schemaName: string,
  requiredKeys?: Set<string>,
): SchemaNode => {
  const output: SchemaNode = {}

  for (const item of map.items) {
    const key = getStringScalar(item.key)
    if (!key) {
      throw new Error(`Clé de schéma invalide dans "${schemaName}" (clé non textuelle)`)
    }

    if (!isMap(item.value)) {
      throw new Error(
        `Propriété "${key}" invalide dans le schéma "${schemaName}" (définition attendue en objet)`,
      )
    }

    const typeEntry = findMapEntry(item.value, 'type')
    const typeValue = typeEntry ? getStringScalar(typeEntry.value) : null
    if (!typeValue) {
      throw new Error(
        `Propriété "${key}" invalide dans le schéma "${schemaName}" (type manquant ou incorrect)`,
      )
    }

    const propertiesEntry = findMapEntry(item.value, 'properties')
    let properties: SchemaNode | undefined
    if (propertiesEntry) {
      if (!isMap(propertiesEntry.value)) {
        throw new Error(
          `Propriété "${key}" invalide dans le schéma "${schemaName}" (properties doit être un objet)`,
        )
      }
      const nestedRequired = parseRequiredKeys(item.value, schemaName, key)
      properties = parseSchemaMap(propertiesEntry.value, `${schemaName}.${key}`, nestedRequired)
    }

    const additionalPropertiesEntry = findMapEntry(item.value, 'additionalProperties')
    let additionalProperties: AdditionalPropertiesDefinition | undefined
    if (additionalPropertiesEntry) {
      if (!isMap(additionalPropertiesEntry.value)) {
        throw new Error(
          `Propriété "${key}" invalide dans le schéma "${schemaName}" (additionalProperties doit être un objet)`,
        )
      }

      const additionalTypeEntry = findMapEntry(additionalPropertiesEntry.value, 'type')
      const additionalTypeValue = additionalTypeEntry
        ? getStringScalar(additionalTypeEntry.value)
        : null
      if (!additionalTypeValue) {
        throw new Error(
          `Propriété "${key}" invalide dans le schéma "${schemaName}" (additionalProperties.type manquant ou incorrect)`,
        )
      }

      const additionalNestedPropertiesEntry = findMapEntry(
        additionalPropertiesEntry.value,
        'properties',
      )
      let additionalNestedProperties: SchemaNode | undefined
      if (additionalNestedPropertiesEntry) {
        if (!isMap(additionalNestedPropertiesEntry.value)) {
          throw new Error(
            `Propriété "${key}" invalide dans le schéma "${schemaName}" (additionalProperties.properties doit être un objet)`,
          )
        }
        additionalNestedProperties = parseSchemaMap(
          additionalNestedPropertiesEntry.value,
          `${schemaName}.${key}`,
        )
      }

      additionalProperties = {
        type: additionalTypeValue,
        properties: additionalNestedProperties,
      }
    }

    output[key] = {
      type: typeValue,
      properties,
      additionalProperties,
      required: requiredKeys?.has(key) ?? false,
      comment: getNodeComment(item.value) ?? getNodeComment(item.key),
    }
  }

  return output
}

const mapType = (
  rawType: string,
  customTypes: Set<string>,
  knownSchemaMap?: Map<string, string>,
): string => {
  const trimmed = rawType.trim()
  const arrayMatch = trimmed.match(/^array<(.+)>$/i)
  if (arrayMatch) {
    const innerTypeRaw = arrayMatch[1]
    if (!innerTypeRaw) {
      throw new Error('Type de tableau invalide : type interne manquant')
    }

    const innerType = mapType(innerTypeRaw, customTypes, knownSchemaMap)
    const normalizedInner =
      innerType.includes(' | ') && !innerType.startsWith('(') ? `(${innerType})` : innerType
    return `${normalizedInner}[]`
  }

  const unionParts = trimmed
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  if (unionParts.length > 1) {
    return unionParts.map((part) => mapType(part, customTypes, knownSchemaMap)).join(' | ')
  }

  const primitive = PRIMITIVE_TYPE_MAP[trimmed.toLowerCase()]
  if (primitive) {
    return primitive
  }

  const alias = SPECIAL_ALIASES[trimmed] ?? SPECIAL_ALIASES[trimmed.toLowerCase()]
  if (alias) {
    return alias
  }

  if (isObjectType(trimmed)) {
    return FALLBACK_TYPE
  }

  const pascalCandidate = toPascalCase(trimmed)
  const resolvedKnownSchema = knownSchemaMap?.get(pascalCandidate)
  if (resolvedKnownSchema) {
    customTypes.add(resolvedKnownSchema)
    return resolvedKnownSchema
  }

  customTypes.add(trimmed)
  return trimmed
}

const resolveDefinitionType = (
  rawType: string,
  parentTypeName: string,
  propertyName: string,
): { typeName: string; normalizedType: string } => {
  const derivedName = toPascalCase(`${parentTypeName} ${propertyName}`)
  const unionParts = splitUnionTypes(rawType)
  let selectedType: string | null = null

  const normalizedParts = unionParts.map((part) => {
    const { base, isArray } = parseArrayType(part)
    let resolvedBase = base

    if (isObjectType(resolvedBase)) {
      resolvedBase = derivedName
    }

    if (!isPrimitiveType(resolvedBase) && !isAliasType(resolvedBase)) {
      if (!selectedType) selectedType = resolvedBase
      if (selectedType !== resolvedBase) {
        throw new Error(
          `Propriété "${propertyName}" invalide (${parentTypeName}) : types multiples pour les propriétés internes`,
        )
      }
    }

    return isArray ? `array<${resolvedBase}>` : resolvedBase
  })

  if (!selectedType) {
    throw new Error(
      `Propriété "${propertyName}" invalide (${parentTypeName}) : propriétés internes sans type complexe`,
    )
  }

  return { typeName: selectedType, normalizedType: normalizedParts.join(' | ') }
}

const extractSchemaNode = (document: Document.Parsed, schemaName: string): SchemaNode => {
  const root = document.contents
  if (!root || !isMap(root)) {
    throw new Error(`Le fichier YAML du schéma "${schemaName}" doit contenir un objet racine`)
  }

  const candidates = [toCamelCase(schemaName), schemaName, schemaName.toLowerCase()]
  for (const candidate of candidates) {
    const entry = findMapEntry(root, candidate)
    if (entry && isMap(entry.value)) {
      const propertiesEntry = findMapEntry(entry.value, 'properties')
      if (propertiesEntry) {
        if (!isMap(propertiesEntry.value)) {
          throw new Error(`Le schéma "${schemaName}" est invalide (properties doit être un objet)`)
        }
        const required = parseRequiredKeys(entry.value, schemaName)
        return parseSchemaMap(propertiesEntry.value, schemaName, required)
      }
      return parseSchemaMap(entry.value, schemaName)
    }
  }

  throw new Error(
    `Le schéma "${schemaName}" ne contient aucune définition reconnue (clés attendues : ${candidates.join(', ')})`,
  )
}

const buildProperties = (
  schemaNode: SchemaNode,
  schemaName: string,
  definitions: Map<string, PropertyDefinition[]>,
  customTypes: Set<string>,
  knownSchemaMap?: Map<string, string>,
): PropertyDefinition[] => {
  return Object.entries(schemaNode).map(([name, definition]) => {
    if (!definition || typeof definition !== 'object' || typeof definition.type !== 'string') {
      throw new Error(
        `Propriété "${name}" invalide dans le schéma "${schemaName}" (type manquant ou incorrect)`,
      )
    }

    let typeSource = definition.type
    if (definition.properties) {
      const { typeName, normalizedType } = resolveDefinitionType(definition.type, schemaName, name)
      typeSource = normalizedType
      buildInterfaceDefinition(
        definition.properties,
        typeName,
        definitions,
        customTypes,
        knownSchemaMap,
      )
    }

    if (definition.additionalProperties) {
      let valueTypeSource = definition.additionalProperties.type
      if (definition.additionalProperties.properties) {
        const { typeName, normalizedType } = resolveDefinitionType(
          definition.additionalProperties.type,
          schemaName,
          `${name}Value`,
        )
        valueTypeSource = normalizedType
        buildInterfaceDefinition(
          definition.additionalProperties.properties,
          typeName,
          definitions,
          customTypes,
          knownSchemaMap,
        )
      }

      const valueType = mapType(valueTypeSource, customTypes, knownSchemaMap)
      return {
        name,
        type: `Record<string, ${valueType}>`,
        required: definition.required,
        comment: definition.comment,
      }
    }

    const tsType = mapType(typeSource, customTypes, knownSchemaMap)
    return { name, type: tsType, required: definition.required, comment: definition.comment }
  })
}

const buildFileContent = (
  interfaceName: string,
  definitions: Map<string, PropertyDefinition[]>,
  customTypes: Set<string>,
  knownSchemaMap?: Map<string, string>,
) => {
  const formatPropertyName = (propertyName: string) =>
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propertyName) ? propertyName : JSON.stringify(propertyName)

  const definedTypes = new Set(definitions.keys())
  const knownSchemaTypeNames = new Set(knownSchemaMap?.values() ?? [])
  const externalImports = Array.from(customTypes)
    .filter((typeName) => !definedTypes.has(typeName))
    .filter((typeName) => typeName !== interfaceName)
    .filter((typeName) => knownSchemaTypeNames.has(typeName))
    .sort()
    .map((typeName) => `import type { ${typeName} } from './${toCamelCase(typeName)}'`)

  const fallbackTypes = Array.from(customTypes)
    .filter((typeName) => typeName !== interfaceName && !definedTypes.has(typeName))
    .filter((typeName) => !knownSchemaTypeNames.has(typeName))
    .sort()
    .map((typeName) => `export type ${typeName} = ${FALLBACK_TYPE}`)

  const interfaceBlocks = Array.from(definitions.entries())
    .sort(([left], [right]) => {
      if (left === interfaceName) return 1
      if (right === interfaceName) return -1
      return left.localeCompare(right)
    })
    .map(([name, properties]) => {
      const interfaceProps = properties
        .map(({ name: propName, type, required, comment }) => {
          const lines = comment ? formatJsDoc(comment) : []
          lines.push(`  ${formatPropertyName(propName)}${required ? '' : '?'}: ${type}`)
          return lines.join('\n')
        })
        .join('\n')
      return `export interface ${name} {\n${interfaceProps}\n}`
    })

  return [...externalImports, ...fallbackTypes, ...interfaceBlocks].filter(Boolean).join('\n\n')
}

const buildInterfaceDefinition = (
  schemaNode: SchemaNode,
  interfaceName: string,
  definitions: Map<string, PropertyDefinition[]>,
  customTypes: Set<string>,
  knownSchemaMap?: Map<string, string>,
) => {
  if (definitions.has(interfaceName)) return
  definitions.set(interfaceName, [])
  const properties = buildProperties(
    schemaNode,
    interfaceName,
    definitions,
    customTypes,
    knownSchemaMap,
  )
  definitions.set(interfaceName, properties)
}

const createTemporaryOutputDir = async (outputDir: string): Promise<string> => {
  const outputParentDir = dirname(outputDir)
  const outputBaseName = basename(outputDir)

  await mkdir(outputParentDir, { recursive: true })

  return mkdtemp(join(outputParentDir, `.${outputBaseName}-`))
}

const replaceOutputDir = async (temporaryOutputDir: string, outputDir: string): Promise<void> => {
  await rm(outputDir, { recursive: true, force: true })
  await rename(temporaryOutputDir, outputDir)
}

const buildIndexContent = (
  schemas: readonly string[],
  resolveTypeName: (schemaName: string) => string,
  resolveFileName: (schemaName: string) => string,
) =>
  schemas
    .map((schemaName) => {
      const resolvedTypeName = resolveTypeName(schemaName)
      const resolvedFileName = resolveFileName(schemaName)
      return `export type { ${resolvedTypeName} } from './${toCamelCase(resolvedFileName)}'`
    })
    .join('\n')
    .concat('\n')

/**
 * Génère les interfaces TypeScript à partir des fichiers YAML fournis.
 * Pour chaque schéma, il parse le YAML, construit les définitions de
 * propriété, écrit les fichiers dans `schemas/interfaces` puis met à jour
 * l’index.
 *
 * @param schemaPath Chemin vers le dossier contenant les schémas YAML.
 * @param schemas Liste des noms de schémas à traiter.
 */
export const generateArtifacts = async (
  schemaPath: string,
  schemas: readonly string[],
  knownSchemas?: readonly string[],
  options?: ArtifactGenerationOptions,
) => {
  const normalizedSchemaPath = normalizePath(schemaPath)
  const outputDir = normalizeOutputDir(options?.outputDir)
  const { knownSchemaMap, resolveTypeName, resolveFileName } = createArtifactContext(
    schemas,
    knownSchemas,
    options,
  )
  await ensureReadableDirectory(normalizedSchemaPath)
  const temporaryOutputDir = await createTemporaryOutputDir(outputDir)
  let outputPromoted = false

  try {
    for (const schemaName of schemas) {
      const resolvedSchemaName = resolveTypeName(schemaName)
      const resolvedFileName = resolveFileName(schemaName)
      const fileName = `${toSnakeCase(schemaName)}.yaml`
      const schemaFilePath = join(normalizedSchemaPath, fileName)

      await ensureReadableFile(schemaFilePath, `pour le schéma "${schemaName}"`)

      const rawContent = await readFile(schemaFilePath, 'utf-8')
      let document: Document.Parsed

      try {
        document = YAML.parseDocument(rawContent)
        if (document.errors.length) {
          throw new Error(document.errors.map((entry) => entry.message).join('; '))
        }
      } catch (error) {
        throw new Error(
          `Erreur de parsing YAML pour le schéma "${schemaName}" : ${(error as Error).message}`,
        )
      }

      const schemaNode = extractSchemaNode(document, schemaName)
      const customTypes = new Set<string>()
      const definitions = new Map<string, PropertyDefinition[]>()
      buildInterfaceDefinition(
        schemaNode,
        resolvedSchemaName,
        definitions,
        customTypes,
        knownSchemaMap,
      )
      const rootProperties = definitions.get(resolvedSchemaName) ?? []

      if (!rootProperties.length) {
        throw new Error(`Le schéma "${schemaName}" ne contient aucune propriété exploitable`)
      }

      const targetFilePath = join(temporaryOutputDir, `${toCamelCase(resolvedFileName)}.ts`)
      const fileContent = buildFileContent(
        resolvedSchemaName,
        definitions,
        customTypes,
        knownSchemaMap,
      )

      try {
        await writeFile(targetFilePath, fileContent, 'utf-8')
      } catch (error) {
        throw new Error(
          `Impossible d'écrire le fichier généré pour "${schemaName}" (${targetFilePath}) : ${(error as Error).message}`,
        )
      }
    }

    const indexPath = join(temporaryOutputDir, 'index.ts')
    const indexContent = buildIndexContent(schemas, resolveTypeName, resolveFileName)
    try {
      await writeFile(indexPath, indexContent, 'utf-8')
    } catch (error) {
      throw new Error(
        `Impossible d'écrire le fichier index des interfaces (${indexPath}) : ${(error as Error).message}`,
      )
    }

    await replaceOutputDir(temporaryOutputDir, outputDir)
    outputPromoted = true
  } finally {
    if (!outputPromoted) {
      await rm(temporaryOutputDir, { recursive: true, force: true })
    }
  }
}
