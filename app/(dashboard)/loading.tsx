import BookLoader from '@/components/ui/BookLoader';

export default function DashboardLoading() {
  return (
    <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
      <BookLoader />
    </div>
  );
}
