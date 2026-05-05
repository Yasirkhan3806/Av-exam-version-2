export const reportError = async (error, errorInfo = null) => {
    try {
        if (error?.message?.includes('Failed to report error')) return;

        let userId = 'Unauthenticated';
        let userName = 'Unknown';

        let token = null;
        if (typeof document !== 'undefined') {
            token = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))
                ?.split('=')[1] || localStorage.getItem('token');
        }

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                if (base64Url) {
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const decoded = JSON.parse(jsonPayload);
                    userId = decoded.id || decoded.userId || decoded._id || userId;
                    userName = decoded.name || decoded.username || decoded.firstName || userName;
                }
            } catch (err) {
                console.error("Token decode error in logger", err);
            }
        }

        const payload = {
            userId,
            userName,
            errorType: error?.name || 'Error',
            message: error?.message || String(error),
            stack: error?.stack || (errorInfo ? errorInfo.componentStack : 'No stack'),
        };

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        await fetch(`${apiUrl}/api/logs/frontend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('Failed to report error:', e);
    }
};
