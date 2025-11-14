// Confetti animation for winner screen
(function() {
  const container = document.getElementById('confetti');
  if (!container) return;

  const colors = [
    '#ff6b35', '#ffd700', '#ff8c42', '#f4a261', 
    '#e76f51', '#ffb703', '#fb8500', '#ff9e00'
  ];

  function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random position
    confetti.style.left = Math.random() * 100 + '%';
    
    // Random color
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    // Random size
    const size = Math.random() * 8 + 6;
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';
    
    // Random shape (some squares, some rectangles)
    if (Math.random() > 0.5) {
      confetti.style.borderRadius = '50%';
    } else {
      confetti.style.width = size * 1.5 + 'px';
    }
    
    // Random animation duration
    const duration = Math.random() * 3 + 2;
    confetti.style.animationDuration = duration + 's';
    
    // Random delay
    const delay = Math.random() * 0.5;
    confetti.style.animationDelay = delay + 's';
    
    container.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, (duration + delay) * 1000);
  }

  // Create initial burst
  for (let i = 0; i < 50; i++) {
    setTimeout(() => createConfetti(), i * 30);
  }

  // Continue creating confetti
  setInterval(() => {
    for (let i = 0; i < 3; i++) {
      createConfetti();
    }
  }, 300);
})();
