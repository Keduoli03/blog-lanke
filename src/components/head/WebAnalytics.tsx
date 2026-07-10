import { analytics } from '@/config.json'

type AnalyticsConfig = {
  enable?: boolean
  umami?: { serverUrl?: string; websiteId?: string }
  google?: { measurementId?: string }
  microsoftClarity?: { projectId?: string }
}

export function WebAnalytics() {
  const config = analytics as AnalyticsConfig
  if (import.meta.env.DEV || !config.enable) return null

  return (
    <>
      {config.umami?.websiteId && (
        <UmamiAnalytics serverUrl={config.umami.serverUrl} websiteId={config.umami.websiteId} />
      )}
      {config.google?.measurementId && (
        <GoogleAnalytics measurementId={config.google.measurementId} />
      )}
      {config.microsoftClarity?.projectId && (
        <MicrosoftClarity projectId={config.microsoftClarity.projectId} />
      )}
    </>
  )
}

function UmamiAnalytics({ serverUrl, websiteId }: { serverUrl?: string; websiteId: string }) {
  const src = `${serverUrl || 'https://cloud.umami.is'}/script.js`

  return <script defer src={src} data-website-id={websiteId} />
}

function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${measurementId}');`,
        }}
      ></script>
    </>
  )
}

function MicrosoftClarity({ projectId }: { projectId: string }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${projectId}");`,
        }}
      ></script>
    </>
  )
}
