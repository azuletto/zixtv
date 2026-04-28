/**
 * Cálcula a distância Euclidiana entre dois elementos
 */
export const getDistance = (rect1, rect2) => {
  const x1 = rect1.left + rect1.width / 2;
  const y1 = rect1.top + rect1.height / 2;
  const x2 = rect2.left + rect2.width / 2;
  const y2 = rect2.top + rect2.height / 2;
  
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Verifica se um elemento está na direção especificada
 */
export const isInDirection = (sourceRect, targetRect, direction) => {
  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  const deltaX = targetCenterX - sourceCenterX;
  const deltaY = targetCenterY - sourceCenterY;

  switch (direction) {
    case 'up':
      return deltaY < -sourceRect.height / 4;
    case 'down':
      return deltaY > sourceRect.height / 4;
    case 'left':
      return deltaX < -sourceRect.width / 4;
    case 'right':
      return deltaX > sourceRect.width / 4;
    default:
      return false;
  }
};

/**
 * Encontra o próximo elemento focável na direção especificada
 */
export const findNextFocusable = (sourceId, elements, direction) => {
  const source = elements.find(el => el.id === sourceId);
  if (!source) return null;

  const sourceRect = source.ref?.getBoundingClientRect();
  if (!sourceRect) return null;

  const candidates = elements.filter(el => {
    if (el.id === sourceId || !el.ref || el.disabled) return false;
    const rect = el.ref.getBoundingClientRect();
    return isInDirection(sourceRect, rect, direction);
  });

  if (candidates.length === 0) return null;

  // Ordena por distância e retorna o mais próximo
  return candidates.reduce((closest, current) => {
    const currentDistance = getDistance(sourceRect, current.ref.getBoundingClientRect());
    const closestDistance = getDistance(sourceRect, closest.ref.getBoundingClientRect());
    return currentDistance < closestDistance ? current : closest;
  });
};

/**
 * Calcula o índice do próximo elemento em uma grade (para navegação horizontal/vertical linear)
 */
export const getGridNavigationIndex = (currentIndex, direction, itemsCount, columns = 1) => {
  let nextIndex = currentIndex;

  switch (direction) {
    case 'right':
      nextIndex = currentIndex + 1;
      break;
    case 'left':
      nextIndex = currentIndex - 1;
      break;
    case 'down':
      nextIndex = currentIndex + columns;
      break;
    case 'up':
      nextIndex = currentIndex - columns;
      break;
    default:
      return currentIndex;
  }

  // Garante que o índice está dentro dos limites
  return Math.max(0, Math.min(itemsCount - 1, nextIndex));
};

/**
 * Valida se um elemento é focável
 */
export const isFocusable = (element) => {
  if (!element) return false;
  if (element.disabled) return false;
  if (element.offsetParent === null) return false; // elemento oculto
  return true;
};

/**
 * Calcula a posição relativa para scroll
 */
export const shouldAutoScroll = (element, container) => {
  if (!element || !container) return false;

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return (
    elementRect.top < containerRect.top ||
    elementRect.bottom > containerRect.bottom ||
    elementRect.left < containerRect.left ||
    elementRect.right > containerRect.right
  );
};
