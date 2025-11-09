// Animación de dibujo para "Mi Tierra Querida"
document.addEventListener('DOMContentLoaded', function() {
    const miTierraDiv = document.getElementById('miTierra');
    const sanJuanDiv = document.getElementById('sanJuan');
    const comenzarBtn = document.querySelector('.comenzar-btn');
    
    // Cargar el SVG de Mi Tierra Querida y aplicar animación de dibujo
    fetch('assets/mitierraquerida.svg')
        .then(response => response.text())
        .then(svgText => {
            // ELIMINAR el fill del SVG antes de insertarlo
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const paths = svgDoc.querySelectorAll('path');
            
            // Eliminar fill de todos los paths ANTES de insertar en el DOM
            paths.forEach(path => {
                path.removeAttribute('fill');
                path.setAttribute('fill', 'none');
            });
            
            // Ahora insertar el SVG modificado
            const serializer = new XMLSerializer();
            const modifiedSvgText = serializer.serializeToString(svgDoc.documentElement);
            miTierraDiv.innerHTML = modifiedSvgText;
            
            const svg = miTierraDiv.querySelector('svg');
            
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
                
                // Obtener los paths ya modificados
                const svgPaths = svg.querySelectorAll('path');
                
                // Aplicar animación de dibujo a cada path
                svgPaths.forEach((path, index) => {
                    const length = path.getTotalLength();
                    
                    // Configurar el path para animación de dibujo
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = length;
                    path.style.stroke = 'white';
                    path.style.strokeWidth = '3';
                    path.style.fill = 'none';
                });
                
                // Esperar un frame para asegurar que los estilos se aplicaron
                requestAnimationFrame(() => {
                    // Mostrar el SVG
                    miTierraDiv.classList.add('ready');
                    
                    // Iniciar las animaciones con delays más cortos y transiciones más suaves
                    svgPaths.forEach((path, index) => {
                        setTimeout(() => {
                            // Usar cubic-bezier para una transición más suave y natural
                            path.style.transition = `stroke-dashoffset 2.8s cubic-bezier(0.4, 0, 0.2, 1)`;
                            path.style.strokeDashoffset = '0';
                            
                            // Después de dibujar, rellenar gradualmente
                            setTimeout(() => {
                                // Transición más lenta y suave para el fill
                                path.style.transition = 'fill 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
                                path.style.fill = 'white';
                                
                                // Opcional: desvanecer el stroke mientras se rellena
                                setTimeout(() => {
                                    path.style.transition = 'stroke-width 1.2s ease-out';
                                    path.style.strokeWidth = '0';
                                }, 600);
                            }, 2400); // Empezar el fill un poco antes para que sea más fluido
                        }, index * 60);
                    });
                });
            }
        })
        .catch(error => console.error('Error loading Mi Tierra Querida SVG:', error));
    
    // Cargar el SVG de San Juan
    fetch('assets/sanjuan.svg')
        .then(response => response.text())
        .then(svgText => {
            sanJuanDiv.innerHTML = svgText;
            const svg = sanJuanDiv.querySelector('svg');
            
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
            }
        })
        .catch(error => console.error('Error loading San Juan SVG:', error));
    
    // Navegación a Pantalla 2 (página independiente)
    if (comenzarBtn) {
        comenzarBtn.addEventListener('click', () => {
            window.location.href = 'pantalla2.html';
        });
    }
});
