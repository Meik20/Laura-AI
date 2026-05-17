export default function HowItWorksPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>Comment ça marche ?</h1>
      <p style={{ fontSize: '1.2rem', color: '#6E6E6B', lineHeight: 1.6, textAlign: 'center', marginBottom: '4rem' }}>
        LAURA AI est conçu pour s'adapter à votre rythme et à votre niveau. Voici comment démarrer :
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #E5E5E2' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>1. Créez votre profil</h2>
          <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>Indiquez votre niveau, votre série et l'examen que vous préparez. LAURA configurera automatiquement son moteur pour vous fournir le contenu le plus pertinent.</p>
        </div>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #E5E5E2' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>2. Fixez vos objectifs</h2>
          <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>Définissez ce que vous souhaitez accomplir (ex: "Réviser le programme de SVT avant fin Mai"). La plateforme suivra votre progression.</p>
        </div>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #E5E5E2' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>3. Interagissez avec l'IA</h2>
          <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>Posez des questions, demandez des explications simplifiées ou générez des quiz d'entraînement à la demande.</p>
        </div>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #E5E5E2' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>4. Simulez l'examen</h2>
          <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>Passez des annales chronométrées et obtenez une correction détaillée pour identifier vos lacunes.</p>
        </div>
      </div>
    </div>
  );
}
