import { Skeleton } from "@/components/ui/skeleton";

export const ShopPageSkeleton = () => (
  <div className="section-padding section-spacing">
    <div className="text-center mb-6 sm:mb-8">
      <Skeleton className="h-8 sm:h-10 w-20 mx-auto mb-2" />
      <Skeleton className="h-4 w-52 mx-auto mb-3" />
      <div className="mx-auto h-[1px] w-[60px] bg-muted" />
    </div>
    <div className="flex flex-col gap-3 mb-8 sm:mb-10 max-w-3xl mx-auto">
      <Skeleton className="h-12 w-full rounded-full" />
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-full" />
        <Skeleton className="h-12 flex-1 rounded-full" />
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 xl:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border/40 overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-2.5 sm:p-4 space-y-2">
            <Skeleton className="h-3 sm:h-4 w-[85%]" />
            <Skeleton className="h-2.5 w-16" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-0.5">
              <Skeleton className="h-7 sm:h-10 flex-1 rounded-full" />
              <Skeleton className="h-7 sm:h-10 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ProductDetailsSkeleton = () => (
  <div className="section-padding pt-6 pb-16">
    <Skeleton className="w-28 h-4 mb-6 rounded-full" />
    <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16">
      <div className="space-y-3">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-[80%]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-12 w-full rounded-full mt-4" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  </div>
);

export const AboutPageSkeleton = () => (
  <div className="page-enter">
    <section className="section-padding py-20 sm:py-28 text-center">
      <Skeleton className="h-9 sm:h-10 w-48 mx-auto mb-3" />
      <Skeleton className="h-4 w-[80%] max-w-xl mx-auto mb-2" />
      <Skeleton className="h-4 w-[60%] max-w-lg mx-auto mb-4" />
      <div className="mx-auto h-[1px] w-[60px] bg-muted" />
    </section>
    <section className="section-padding pb-20 lg:pb-28">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <Skeleton className="aspect-[3/2] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[78%]" />
        </div>
      </div>
    </section>
  </div>
);

export const ContactPageSkeleton = () => (
  <div className="page-enter">
    <section className="section-padding py-10 sm:py-12 lg:py-14 text-center section-alt">
      <Skeleton className="h-8 sm:h-10 w-64 mx-auto mb-2" />
      <Skeleton className="h-4 w-[70%] max-w-lg mx-auto mb-3" />
      <div className="mx-auto h-[1px] w-[60px] bg-muted" />
    </section>
    <section className="section-padding py-8 sm:py-10 lg:py-12">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </section>
    <section className="section-padding pb-10 lg:pb-14">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 max-w-6xl mx-auto">
        <div className="space-y-3.5 glass-card rounded-2xl p-5 sm:p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </section>
  </div>
);
