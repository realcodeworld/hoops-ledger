import { ListSkeleton } from '@/components/hoops/loading-skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="h-9 w-48 rounded-lg bg-gray-200 animate-pulse" />
      <ListSkeleton rows={8} />
    </div>
  )
}
