async function postChat(body) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    let data
    try {
      data = await res.json()
    } catch {
      return { ok: false, error: 'Invalid response from server.' }
    }

    if (!res.ok) {
      return { ok: false, error: data.error || 'Request failed.' }
    }

    return { ok: true, data }
  } catch {
    return {
      ok: false,
      error: 'Connection lost. Check your internet and try again.',
    }
  }
}

export function useGroqAPI() {
  const sendMainQuery = async (messages) => {
    return postChat({ type: 'main', messages })
  }

  const getReflection = async (query, response) => {
    return postChat({ type: 'reflection', query, response })
  }

  const getFollowup = async (query, response, criticalQuestion, briefSummary) => {
    return postChat({
      type: 'followup',
      query,
      response,
      criticalQuestion,
      briefSummary,
    })
  }

  return { sendMainQuery, getReflection, getFollowup }
}
