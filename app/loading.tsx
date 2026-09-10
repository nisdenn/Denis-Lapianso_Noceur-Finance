import BookLoader from '@/components/ui/BookLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F1F3F5]/80 backdrop-blur-sm">
      <BookLoader />
    </div>
  );
}
