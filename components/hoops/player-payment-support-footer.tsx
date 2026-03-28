import { WhatsappBrandIcon } from '@/components/hoops/whatsapp-brand-icon'

type Props = {
  whatsappHref: string | null
}

/**
 * Original-style WhatsApp help block at the bottom of player payment views.
 */
export function PlayerPaymentSupportFooter({ whatsappHref }: Props) {
  if (!whatsappHref) return null

  return (
    <section
      className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center sm:text-left"
      aria-label="Payment help"
    >
      <p className="text-sm text-gray-500 mb-2">
        Have a query about your payments?
      </p>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 text-[#128C7E] font-semibold hover:text-[#075E54] transition-colors min-h-11"
      >
        <WhatsappBrandIcon className="h-6 w-6 shrink-0 text-[#25D366]" />
        Chat on WhatsApp
      </a>
    </section>
  )
}
