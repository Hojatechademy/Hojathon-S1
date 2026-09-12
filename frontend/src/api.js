const API_PREFIX = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.detail || `Request failed with status ${response.status}.`)
  }

  return payload
}

export function createSession(goal, days, hoursPerDay) {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify({ goal, days, hours_per_day: hoursPerDay }),
  })
}

export function getSession(sessionId) {
  return request(`/sessions/${sessionId}`)
}

export function submitDiagnostic(sessionId, answers) {
  return request(`/sessions/${sessionId}/diagnostic/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export function getPractice(sessionId) {
  return request(`/sessions/${sessionId}/practice`)
}

export function getProgress(sessionId) {
  return request(`/sessions/${sessionId}/progress`)
}

export function submitPractice(sessionId, answers) {
  return request(`/sessions/${sessionId}/practice/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}
