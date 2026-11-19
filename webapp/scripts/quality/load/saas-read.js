import http from 'k6/http'
import { check } from 'k6'

const config = JSON.parse(open('/run/inputs/config.json'))
const scenario = __ENV.SAAS_SCENARIO
if (!['list', 'detail'].includes(scenario)) throw new Error('Scénario invalide')
const prefix = `/api/saas/projects/${config.project}/articles`
const path = scenario === 'list' ? prefix : `${prefix}/${config.article}`
export const options = {
  scenarios: {
    bounded: {
      executor: 'shared-iterations',
      vus: config.profile === 'measure' ? 3 : 1,
      iterations: config.profile === 'measure' ? 30 : 3,
      maxDuration: '20s',
      gracefulStop: '1s',
    },
  },
  systemTags: ['status', 'method', 'name', 'check'],
  maxRedirects: 0,
  thresholds: { checks: ['rate==1'], http_req_failed: ['rate==0'] },
}
export default function () {
  const response = http.get(config.origin + path, {
    headers: { Cookie: `gd_saas=${config.session}` },
    redirects: 0,
    timeout: '5s',
    tags: { name: scenario },
  })
  let body
  try {
    body = response.json()
  } catch {
    body = null
  }
  check(response, {
    'statut attendu': (r) => r.status === 200,
    'réponse valide': () =>
      scenario === 'list'
        ? Array.isArray(body?.items) && body.items.length > 0
        : body?.id === config.article,
  })
}
