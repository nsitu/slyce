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
     * Create a new texture set and get upload info
     * POST /upload/texture-set
     */
    async function createTextureSet(metadata) {
        const token = await getAccessToken()

        const response = await fetch(`${API_BASE_URL}/upload/texture-set`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(metadata),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to create texture set' }))
            throw new Error(error.error || 'Failed to create texture set')
        }

        return response.json()
    }

    /**
     * Upload a single tile to the texture set
     * PUT /upload/texture-set/:setId/tile/:index
     */
    async function uploadTile(textureSetId, tileIndex, fileData) {
        const token = await getAccessToken()

        const response = await fetch(
            `${API_BASE_URL}/upload/texture-set/${textureSetId}/tile/${tileIndex}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'image/ktx2',
                    'Authorization': `Bearer ${token}`,
                },
                body: fileData,
            }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Tile upload failed' }))
            throw new Error(error.error || `Tile ${tileIndex} upload failed`)
        }

        return response.json()
    }

    /**
     * Mark texture set upload as complete
     * POST /upload/texture-set/:id/complete
     */
    async function completeTextureSet(textureSetId) {
        const token = await getAccessToken()

        const response = await fetch(
            `${API_BASE_URL}/upload/texture-set/${textureSetId}/complete`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to complete upload' }))
            throw new Error(error.error || 'Failed to complete upload')
        }

        return response.json()
    }

    /**
     * Complete texture set upload workflow
     * Creates set, uploads all tiles, marks complete
     * 
     * @param {Object} options - Upload options
     * @param {string} options.name - Texture set name
     * @param {string} options.description - Optional description
     * @param {number} options.tileResolution - Tile resolution (256, 512, 1024, etc.)
     * @param {number} options.layerCount - Layers per tile
     * @param {string} options.crossSectionType - 'planes' or 'waves'
     * @param {Object} options.sourceMetadata - Source file metadata
     * @param {Array<{index: number, blob: Blob}>} options.tiles - Array of tile data
     * @param {Function} options.onProgress - Progress callback (tileIndex, total)
     */
    async function uploadTextureSet(options) {
        const {
            name,
            description,
            tileResolution,
            layerCount,
            crossSectionType,
            sourceMetadata,
            tiles,
            onProgress,
        } = options

        // 1. Create texture set
        const { textureSetId, uploadUrls } = await createTextureSet({
            name,
            description,
            tileResolution,
            tileCount: tiles.length,
            layerCount,
            crossSectionType,
            sourceMetadata,
        })

        // 2. Upload each tile
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i]
            // Convert blob to ArrayBuffer for upload
            const arrayBuffer = await tile.blob.arrayBuffer()
            await uploadTile(textureSetId, tile.index, arrayBuffer)

            if (onProgress) {
                onProgress(i + 1, tiles.length)
            }
        }

        // 3. Mark as complete
        await completeTextureSet(textureSetId)

        // 4. Return texture set info with CDN URLs
        return {
            textureSetId,
            cdnUrls: uploadUrls.map((info) => ({
                tileIndex: info.tileIndex,
                url: `https://cdn.rivvon.ca/${info.r2Key}`,
            })),
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
        createTextureSet,
        uploadTile,
        completeTextureSet,
        uploadTextureSet,
        listTextures,
        getTexture,
    }
}
