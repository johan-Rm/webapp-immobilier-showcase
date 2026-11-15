import http from 'k6/http'
import { check } from 'k6'
const route = JSON.parse(__ENV.QUALITY_ROUTE)
if (
  !/^http:\/\/(?:127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(__ENV.QUALITY_BASE_URL) ||
  !route.path.startsWith('/') ||
  route.path.startsWith('//')
)
  throw new Error('Origine ou chemin de test invalide')
export const options = {
  scenarios: {
    bounded: {
      executor: 'shared-iterations',
      vus: __ENV.QUALITY_LOAD_PROFILE === 'measure' ? 3 : 1,
      iterations: __ENV.QUALITY_LOAD_PROFILE === 'measure' ? 30 : 3,
      maxDuration: '20s',
      gracefulStop: '1s',
    },
  },
  maxRedirects: 0,
  thresholds: { checks: ['rate==1'], http_req_failed: ['rate==0'] },
}
export default function () {
  const response = http.get(__ENV.QUALITY_BASE_URL + route.path, {
    redirects: 0,
    timeout: '5s',
    responseCallback: http.expectedStatuses(route.status),
  })
  check(response, {
    'statut attendu': (r) => r.status === route.status,
    'contenu attendu': (r) => typeof r.body === 'string' && r.body.includes(route.contains),
  })
}
