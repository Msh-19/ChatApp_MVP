import { LinkPreview } from '@/types/chat'
import { ExternalLink } from 'lucide-react'

interface LinkPreviewProps {
  preview: LinkPreview
}

export default function LinkPreviewCard({ preview }: LinkPreviewProps) {
  const { url, title, description, image, domain } = preview

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors group max-w-md bg-white shadow-sm"
    >
      {image && (
        <div className="relative w-full h-48 bg-gray-100">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-[#2D9C86] transition-colors">
            {title}
          </h4>
          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        </div>
        {description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {description}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-gray-200"></span>
          {domain}
        </p>
      </div>
    </a>
  )
}
