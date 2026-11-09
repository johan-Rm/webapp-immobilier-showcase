type ContactSubmitStatus = 'idle' | 'success' | 'error'

const CONTACT_ERROR_MESSAGE =
  "L'envoi du message a échoué. Vous pouvez réessayer ou nous contacter directement par email."

export const useContactForm = () => {
  const isSubmitting = ref(false)
  const submitStatus = ref<ContactSubmitStatus>('idle')
  const submitErrorMessage = ref('')

  const resetSubmissionState = (): void => {
    submitStatus.value = 'idle'
    submitErrorMessage.value = ''
  }

  const submitContact = async (payload: ContactPayload): Promise<ContactResponse> => {
    if (payload.website?.trim()) {
      submitStatus.value = 'success'

      return { success: true }
    }

    isSubmitting.value = true
    submitStatus.value = 'idle'
    submitErrorMessage.value = ''

    try {
      const response = await $fetch<ContactResponse>('/api/contact', {
        method: 'POST',
        body: payload,
      })

      submitStatus.value = 'success'

      return response
    } catch {
      submitStatus.value = 'error'
      submitErrorMessage.value = CONTACT_ERROR_MESSAGE

      return { success: false }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    submitStatus,
    submitErrorMessage,
    resetSubmissionState,
    submitContact,
  }
}
