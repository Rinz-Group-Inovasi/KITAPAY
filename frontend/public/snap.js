(function (global) {
    if (global.kitapay) return;

    // Find the base URL of the script itself to load the iframe relatively if needed
    // Assuming the script is hosted on the same origin as the frontend
    const scriptTag = document.currentScript;
    const scriptUrl = scriptTag ? scriptTag.src : 'http://localhost:3000/snap.js';
    const baseUrl = new URL(scriptUrl).origin;

    const overlayId = 'kitapay-snap-overlay';
    const iframeId = 'kitapay-snap-iframe';

    const snap = {
        pay: function (token, options = {}) {
            if (!token) {
                console.error('KitaPay Snap: Token is required');
                return;
            }

            // Clean up existing if present
            this.close();

            // Create Overlay
            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.backdropFilter = 'blur(4px)';
            overlay.style.zIndex = '2147483647';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';

            // Create Iframe Container
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.style.width = '100%';
            container.style.maxWidth = '420px';
            container.style.height = '100%';
            container.style.maxHeight = '650px';
            container.style.backgroundColor = 'transparent';
            container.style.borderRadius = '16px';
            container.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            container.style.transform = 'scale(0.95) translateY(20px)';
            container.style.transition = 'transform 0.4s cubic-bezier(0.32,0.72,0,1)';
            container.style.overflow = 'hidden';
            
            // Handle mobile sizing
            if (window.innerWidth <= 480) {
                container.style.maxWidth = '100%';
                container.style.maxHeight = '100%';
                container.style.borderRadius = '0px';
            }

            // Create Close Button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&#x2715;'; // X mark
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '12px';
            closeBtn.style.right = '12px';
            closeBtn.style.width = '30px';
            closeBtn.style.height = '30px';
            closeBtn.style.borderRadius = '15px';
            closeBtn.style.backgroundColor = 'rgba(0,0,0,0.1)';
            closeBtn.style.color = '#333';
            closeBtn.style.border = 'none';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.zIndex = '10';
            closeBtn.style.fontSize = '14px';
            closeBtn.style.display = 'flex';
            closeBtn.style.alignItems = 'center';
            closeBtn.style.justifyContent = 'center';
            closeBtn.onclick = () => {
                this.close();
                if (options.onClose) options.onClose();
            };

            // Create Iframe
            const iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.src = `${baseUrl}/snap/${token}`;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.backgroundColor = '#fff';
            iframe.allow = 'clipboard-write';

            // Assemble
            container.appendChild(iframe);
            // container.appendChild(closeBtn); // We'll let the iframe handle its own close button if needed, but adding an external fallback is good.
            overlay.appendChild(container);
            document.body.appendChild(overlay);

            // Animate In
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                container.style.transform = 'scale(1) translateY(0)';
            });

            // Message Listener
            this._messageListener = (event) => {
                if (event.origin !== baseUrl) return;
                
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'KITAPAY_SNAP_CLOSE') {
                        this.close();
                        if (options.onClose) options.onClose();
                    } else if (data.type === 'KITAPAY_SNAP_SUCCESS') {
                        if (options.onSuccess) options.onSuccess(data.payload);
                        // Optional: auto-close after success
                        // setTimeout(() => this.close(), 3000);
                    }
                } catch (e) {
                    // Ignore non-json messages
                }
            };

            window.addEventListener('message', this._messageListener);
        },

        close: function () {
            const overlay = document.getElementById(overlayId);
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300); // match transition
            }
            if (this._messageListener) {
                window.removeEventListener('message', this._messageListener);
                this._messageListener = null;
            }
        }
    };

    global.kitapay = snap;
})(window);
