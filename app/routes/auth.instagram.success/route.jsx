// Page de succès qui ferme la popup
export default function InstagramSuccess() {
  return (
    <html>
      <head>
        <title>Connexion réussie</title>
      </head>
      <body>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1>✅ Connexion Instagram réussie !</h1>
          <p>Cette fenêtre va se fermer automatiquement...</p>
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.close();
            }, 2000);
          `
        }} />
      </body>
    </html>
  );
}
