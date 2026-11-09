export function useTypewriter() {
  /**
   * Crée un effet d'écriture automatique (typewriter) sur un élément HTML
   * @param initialText - Le texte à animer
   * @param options - Options de configuration
   * @returns Un objet contenant le texte animé et des méthodes de contrôle
   */
  const createTypewriterEffect = (
    initialText: string,
    options: {
      speed?: number // Vitesse d'écriture en millisecondes
      charsPerTick?: number // Nombre de caractères affichés par tick
      startDelay?: number // Délai avant de commencer l'animation
      cursor?: boolean // Afficher un curseur
      html?: boolean // Si true, traite le texte comme du HTML
    } = {},
  ) => {
    const defaultOptions = {
      speed: 1,
      charsPerTick: 1, // Par défaut, 1 caractère par tick
      startDelay: 0,
      cursor: true,
      html: false,
    }

    const config = { ...defaultOptions, ...options }
    const currentText = ref(initialText)
    const displayedText = ref('')
    const displayedHtml = ref('')
    const isTyping = ref(false)
    const isComplete = ref(false)
    let timer: NodeJS.Timeout | null = null

    // Fonction pour démarrer l'animation
    const startTyping = () => {
      if (isTyping.value) return

      isTyping.value = true
      isComplete.value = false
      displayedText.value = ''
      displayedHtml.value = ''

      let index = 0
      const textToAnimate = currentText.value

      // Délai initial avant de commencer
      setTimeout(() => {
        timer = setInterval(() => {
          if (index < textToAnimate.length) {
            // Ajouter plusieurs caractères à la fois pour accélérer l'animation
            const charsToAdd = Math.min(config.charsPerTick, textToAnimate.length - index)
            displayedText.value += textToAnimate.substring(index, index + charsToAdd)
            index += charsToAdd

            // Si on traite du HTML, on met à jour la version HTML
            if (config.html) {
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = textToAnimate.substring(0, index)
              displayedHtml.value = tempDiv.innerHTML
            }
          } else {
            isTyping.value = false
            isComplete.value = true
            if (timer) clearInterval(timer)
          }
        }, config.speed)
      }, config.startDelay)
    }

    // Fonction pour arrêter l'animation
    const stopTyping = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      isTyping.value = false
    }

    // Fonction pour compléter immédiatement l'animation
    const completeTyping = () => {
      stopTyping()
      displayedText.value = currentText.value
      if (config.html) {
        displayedHtml.value = currentText.value
      }
      isComplete.value = true
    }

    // Nettoyage lors de la destruction du composant
    onBeforeUnmount(() => {
      stopTyping()
    })

    return {
      displayedText,
      displayedHtml,
      isTyping,
      isComplete,
      startTyping,
      stopTyping,
      completeTyping,
      cursorClass: config.cursor ? 'typewriter-cursor' : '',
      // Propriété pour mettre à jour le texte
      set text(newText: string) {
        currentText.value = newText
      },
      get text() {
        return currentText.value
      },
    }
  }

  return {
    createTypewriterEffect,
  }
}
