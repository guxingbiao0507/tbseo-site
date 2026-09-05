interface ContactForm {
  name: string
  email: string
  company: string
  content: string
}

export function useContactForm() {
  const { t } = useI18n()

  const form = ref<ContactForm>({ name: '', email: '', company: '', content: '' })
  const submitting = ref(false)
  const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async () => {
    submitting.value = true
    feedback.value = null
    try {
      const message = form.value.company
        ? `[Company: ${form.value.company}]\n\n${form.value.content}`
        : form.value.content

      await $fetch('/api/contact', {
        method: 'POST',
        body: {
          name: form.value.name.trim(),
          email: form.value.email.trim(),
          phone: form.value.company.trim() || undefined,
          message: message.trim(),
        },
      })

      feedback.value = { type: 'success', message: t('contact.success') }
      form.value = { name: '', email: '', company: '', content: '' }
    } catch (e: unknown) {
      const err = e as { data?: { statusMessage?: string } }
      feedback.value = {
        type: 'error',
        message: err?.data?.statusMessage || t('contact.error'),
      }
    } finally {
      submitting.value = false
    }
  }

  return { form, submitting, feedback, handleSubmit }
}
