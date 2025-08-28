export function initializeSplitPaneResizer() {
  const divider = document.getElementById('split-divider');
  const leftPane = document.querySelector('.left-pane') as HTMLElement;
  const rightPane = document.querySelector('.right-pane') as HTMLElement;
  const container = document.querySelector('.split-container') as HTMLElement;
  
  if (!divider || !leftPane || !rightPane || !container) return;
  
  let isResizing = false;
  
  divider.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  });
  
  function handleMouseMove(e: MouseEvent) {
    if (!isResizing) return;
    
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    const leftWidth = (mouseX / containerWidth) * 100;
    const rightWidth = 100 - leftWidth;
    
    // Enforce minimum widths (20% each side)
    if (leftWidth < 20 || rightWidth < 20) return;
    
    leftPane.style.flex = `0 0 ${leftWidth}%`;
    rightPane.style.flex = `0 0 ${rightWidth}%`;
  }
  
  function handleMouseUp() {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
}
