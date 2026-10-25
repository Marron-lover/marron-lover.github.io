import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cesium from 'vite-plugin-cesium'
// @ts-expect-error Node-only Vite plugin.
import { travelAtlasLocalEditor } from './scripts/local-editor-plugin.mjs'
// @ts-expect-error Node-only profile helper.
import { getPrivatePaths } from './scripts/private-profile.mjs'
// @ts-expect-error Node-only approved content plugin.
import { approvedTravelContent } from './scripts/approved-content.mjs'
// @ts-expect-error Node-only review editor plugin.
import { travelReviewEditor } from './scripts/review-editor.mjs'
export default defineConfig(({ mode }) => {
  const profile = mode === 'personal' ? 'personal' : 'public'
  const approved = mode === 'approved'
  const privatePaths = getPrivatePaths()
  const envDir = profile === 'personal' ? privatePaths.configRoot : false
  const personalEnv = profile === 'personal' ? loadEnv(mode, envDir, '') : {}
  const approvedRoot = process.env.STARMAP_APPROVED_ROOT || path.resolve('approved-public')
  return {
    base: approved ? (process.env.STARMAP_APPROVED_BASE || '/travel/') : '/',
    envDir,
    define: approved ? {
      'import.meta.env.VITE_CESIUM_ION_TOKEN': JSON.stringify(''),
      'import.meta.env.VITE_TIANDITU_TOKEN': JSON.stringify(''),
      'import.meta.env.VITE_MAP_SOURCE': JSON.stringify('local'),
      'import.meta.env.VITE_GALLERY_FIXTURE': JSON.stringify(process.env.STARMAP_LOCAL_FIXTURE === '1' ? 'true' : 'false'),
      'import.meta.env.VITE_GALLERY_PREVIEW': JSON.stringify(process.env.STARMAP_APPROVED_BASE ? 'true' : 'false'),
    } : undefined,
    resolve: approved ? {alias:[{find:/\.\.\/data\/localEditorApi$/,replacement:path.resolve('scripts/readonly-client.mjs')}]} : undefined,
    plugins:[approved ? approvedTravelContent({approvedRoot}) : travelAtlasLocalEditor({profile,privateRoot:privatePaths.root,cesiumAccessToken:personalEnv.VITE_CESIUM_ION_TOKEN}),travelReviewEditor({profile,privateRoot:privatePaths.root}),react(),tailwindcss(),cesium()],
    build:{outDir:process.env.STARMAP_BUILD_OUTDIR || 'dist',emptyOutDir:true},
    server:{watch:{ignored:['**/public/media/user/**']}}
  }
})
