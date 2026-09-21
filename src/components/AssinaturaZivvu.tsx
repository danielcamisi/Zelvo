/**
 * Assinatura da Zivvu.
 *
 * Fica no rodapé das telas onde o app se apresenta: o login e as
 * configurações. Texto, não imagem — a paleta é monocromática e um logo
 * colorido brigaria com ela.
 */
export default function AssinaturaZivvu({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-[12px] tracking-[0.06em] text-tenue ${className}`}>
      Desenvolvido pela{' '}
      <span className="font-semibold text-suave" style={{ fontFamily: 'var(--fonte-display), sans-serif' }}>
        ZIVVU
      </span>
    </p>
  )
}
