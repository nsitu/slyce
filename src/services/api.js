import { useAuth0 } from '@auth0/auth0-vue'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.rivvon.ca'

/**
 * Rivvon API client with Auth0 authentication
 * Must be used within Vue component context (setup or lifecycle hooks)
 */
export function useRivvonAPI() {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0()

    /**
     * Get access token for API requests
     */
    async function getAccessToken() {
        try {
            const token = await getAccessTokenSilently()
            return token
        } catch (error) {
            console.error('Failed to get access token:', error)
            throw new Error('Authentication required')
        }
    }

    /**
     * Request a signed upload URL from the API
     */
    async function requestUploadUrl(filename, contentType = 'application/octet-stream') {
        const token = await getAccessToken()

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                filename,
                contentType,
            }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload request failed' }))
            throw new Error(error.message || 'Upload request failed')
        }

        return response.json()
    }

    /**
     * Upload file directly to R2 using signed URL
     */
    async function uploadFile(signedUrl, file, contentType = 'application/octet-stream') {
        const response = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
            },
            body: file,
        })

        if (!response.ok) {
            throw new Error('File upload failed')
        }

        return response
    }

    /**
     * Complete texture upload workflow
     */
    async function uploadTexture(file, filename) {
        // 1. Request signed URL
        const { uploadUrl, textureId, key } = await requestUploadUrl(
            filename,
            'application/octet-stream'
        )

        // 2. Upload file to R2
        await uploadFile(uploadUrl, file)

        // 3. Return texture info
        return {
            textureId,
            key,
            cdnUrl: `https://cdn.rivvon.ca/${key}`,
        }
    }

    /**
     * Get list of all textures (public endpoint)
     */
    async function listTextures() {
        const response = await fetch(`${API_BASE_URL}/textures`)

        if (!response.ok) {
            throw new Error('Failed to fetch textures')
        }

        return response.json()
    }

    /**
     * Get texture metadata by ID (public endpoint)
     */
    async function getTexture(textureId) {
        const response = await fetch(`${API_BASE_URL}/textures/${textureId}`)

        if (!response.ok) {
            throw new Error('Failed to fetch texture')
        }

        return response.json()
    }

    return {
        isAuthenticated,
        getAccessToken,
        requestUploadUrl,
        uploadFile,
        uploadTexture,
        listTextures,
        getTexture,
    }
}
