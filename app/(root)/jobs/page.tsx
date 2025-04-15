// app/(root)/jobs/page.tsx
"use client"; // Required because we use hooks for state and effects

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NoResult from "@/components/shared/NoResult";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton import
import { formUrlQuery, cn } from "@/lib/utils"; // <-- Combined import

// Define the Job interface (adjust based on actual data structure if using API)
interface IJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string; // e.g., "Full-time", "Part-time"
  description?: string; // Optional full description
  applyLink?: string; // Optional direct apply link
  companyLogo?: string; // Optional logo URL
  postedDate?: Date; // Optional date
}

// --- Mock Job Data ---
const mockJobs: IJob[] = [
  { id: "1", title: "Frontend Developer (React & Next.js)", company: "Tech Solutions Inc.", location: "San Francisco, CA", employmentType: "Full-time", applyLink: "#", companyLogo: "/assets/images/site-logo.svg", postedDate: new Date("2024-03-28") },
  { id: "2", title: "Backend Engineer (Node.js, Go)", company: "Innovate Hub", location: "New York, NY", employmentType: "Full-time", applyLink: "#", postedDate: new Date("2024-03-27") }, // No logo intentionally
  { id: "3", title: "React Native Developer", company: "Mobile First Co.", location: "Remote", employmentType: "Full-time", applyLink: "#", companyLogo: "/assets/images/site-logo.svg", postedDate: new Date("2024-03-26") },
  { id: "4", title: "Senior UI/UX Designer", company: "Creative Designs Ltd.", location: "Austin, TX", employmentType: "Contract", applyLink: "#", postedDate: new Date("2024-03-25") }, // No logo intentionally
  { id: "5", title: "Full Stack Developer (Python/React)", company: "Data Systems", location: "London, UK", employmentType: "Full-time", applyLink: "#", companyLogo: "/assets/images/site-logo.svg", postedDate: new Date("2024-03-29") },
  { id: "6", title: "Cloud DevOps Engineer (AWS/GCP)", company: "CloudNative Corp.", location: "Remote", employmentType: "Full-time", applyLink: "#", postedDate: new Date("2024-03-24") }, // No logo intentionally
  { id: "7", title: "Machine Learning Engineer", company: "AI Innovations", location: "Seattle, WA", employmentType: "Full-time", applyLink: "#", companyLogo: "/assets/images/site-logo.svg", postedDate: new Date("2024-03-23") },
  { id: "8", title: "Junior Web Developer (Vue.js)", company: "Web Weavers", location: "San Francisco, CA", employmentType: "Part-time", applyLink: "#", postedDate: new Date("2024-03-30") }, // No logo intentionally
];
// --- End Mock Job Data ---

// --- Enhanced & Detailed Job Card Component ---
const JobCard: React.FC<{ job: IJob }> = ({ job }) => {
  const hasLogo = !!job.companyLogo;

  return (
    <article className="card-wrapper p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6 transition-shadow duration-200 hover:shadow-light-200 dark:hover:shadow-dark-200">
      {/* Logo or Placeholder Area */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-xl border", // Consistent size & shape
          hasLogo
            ? "p-1 bg-white" // Padding for actual logos on white background
            : "bg-light-800 dark:bg-dark-300", // Background for placeholder
           "border-neutral-200 dark:border-neutral-700/50" // Subtle border
        )}
      >
        {hasLogo ? (
          <Image
            src={job.companyLogo!} // Assert non-null because we checked hasLogo
            alt={`${job.company} logo`}
            width={64}
            height={64}
            className="object-contain rounded-lg" // Contain logo within space
          />
        ) : (
          // Placeholder Icon (using suitcase)
          <Image
            src="/assets/icons/suitcase.svg"
            alt="Default job icon"
            width={32} // Size of the placeholder icon
            height={32}
            className="invert-colors opacity-40 dark:opacity-50" // Style placeholder
          />
        )}
      </div>

      {/* Job Details Section */}
      <div className="flex-grow flex flex-col justify-between gap-4"> {/* Added gap */}
        {/* Top Section: Title & Company */}
        <div>
          <h3 className="h3-semibold text-dark200_light900 line-clamp-2 sm:line-clamp-1"> {/* Allow more lines on mobile */}
            {job.title}
          </h3>
          <p className="body-regular text-dark500_light500 mt-1">
            {job.company}
          </p>
        </div>

         {/* Middle Section: Location, Type, Date */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <Image src="/assets/icons/location.svg" alt="location" width={16} height={16} className="invert-colors opacity-70" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <Image src="/assets/icons/suitcase.svg" alt="type" width={16} height={16} className="invert-colors opacity-70" />
            <span>{job.employmentType}</span>
          </div>
          {job.postedDate && (
              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
               <Image src="/assets/icons/clock.svg" alt="clock" width={16} height={16} className="invert-colors opacity-70" />
                <span>{job.postedDate.toLocaleDateString()}</span>
              </div>
          )}
        </div>

        {/* Bottom Section: Apply Button */}
        {job.applyLink && (
            <div className="flex justify-end mt-2 sm:mt-0"> {/* Adjust margin */}
                <Link href={job.applyLink} target="_blank" rel="noopener noreferrer">
                 <Button size="sm" className="primary-gradient min-h-[36px] rounded-lg px-4 py-1.5 !text-light-900 text-xs font-semibold shadow-md hover:shadow-lg transition-shadow duration-200"> {/* Smaller button */}
                    Apply Now
                    <Image src="/assets/icons/arrow-up-right.svg" alt="apply" width={14} height={14} className="ml-1.5 invert dark:invert-0"/> {/* Optional arrow icon */}
                 </Button>
                </Link>
            </div>
        )}
      </div>
    </article>
  );
};
// --- End Job Card Component ---

// --- Debounce Hook ---
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
// --- End Debounce Hook ---

// --- Main Page Component ---
const JobsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for search inputs
  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  // Debounce search terms
  const debouncedQuery = useDebounce(query, 500);
  const debouncedLocation = useDebounce(location, 500);

  // State for job data & loading
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [isFetching, setIsFetching] = useState(true); // Use different name from loading.tsx

  // State for pagination
  const jobsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Simulate fetching data
  useEffect(() => {
    setIsFetching(true); // Start fetching indicator
    const timer = setTimeout(() => {
      setJobs(mockJobs);
      setIsFetching(false); // Finish fetching indicator
    }, 800); // Shorter delay
    return () => clearTimeout(timer);
  }, []);

   // Update URL when debounced search terms change
   useEffect(() => {
    if (debouncedQuery !== initialQuery || debouncedLocation !== initialLocation) {
      const newUrl = formUrlQuery({
        params: searchParams.toString(), key: 'q', value: debouncedQuery || null
      });
      const finalUrl = formUrlQuery({
        params: newUrl, key: 'location', value: debouncedLocation || null
      });
      router.push(finalUrl, { scroll: false });
      setCurrentPage(1); // Reset to page 1 on new search
    }
  }, [debouncedQuery, debouncedLocation, router, pathname, searchParams, initialQuery, initialLocation]);


  // Filter jobs based on debounced search terms
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const queryMatch = debouncedQuery
        ? job.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(debouncedQuery.toLowerCase())
        : true;
      const locationMatch = debouncedLocation
        ? job.location.toLowerCase().includes(debouncedLocation.toLowerCase())
        : true;
      return queryMatch && locationMatch;
    });
  }, [jobs, debouncedQuery, debouncedLocation]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <section>
      <h1 className="h1-bold text-dark100_light900">Find Your Next Opportunity</h1> {/* Slightly better title */}

      {/* Search and Filter Bar */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center md:mt-11 md:gap-5">
        {/* Job Search Input */}
        <div className="relative flex-1">
          <Image
            src="/assets/icons/search.svg" alt="Search" width={20} height={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" // Using text color for potential SVG fill
          />
          <Input
            type="text" placeholder="Job title, company, keyword..." value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="paragraph-regular no-focus placeholder:text-neutral-400 text-dark400_light700 background-light800_darkgradient light-border-2 pl-12 pr-4 min-h-[52px] border rounded-lg focus-visible:ring-1 focus-visible:ring-primary-500/50" // Slightly smaller height, focus ring
          />
        </div>
        {/* Location Search Input */}
        <div className="relative w-full sm:max-w-[280px]"> {/* Max width for location */}
           <Image
            src="/assets/icons/location.svg" alt="Location" width={20} height={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            type="text" placeholder="City, State, Zip, or Remote" value={location}
            onChange={(e) => setLocation(e.target.value)}
             className="paragraph-regular no-focus placeholder:text-neutral-400 text-dark400_light700 background-light800_darkgradient light-border-2 pl-12 pr-4 min-h-[52px] border rounded-lg focus-visible:ring-1 focus-visible:ring-primary-500/50"
          />
        </div>
      </div>

      {/* Job Listings */}
      <div className="mt-10 flex flex-col gap-6">
        {/* Handle fetching state */}
        {isFetching ? (
             [1, 2, 3, 4, 5].map((item) => ( // Show more skeletons initially
                // Use the imported Skeleton component correctly
                <Skeleton key={item} className="h-[180px] w-full rounded-xl" /> // Adjusted height
             ))
        ) : paginatedJobs.length > 0 ? (
          paginatedJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          // Display NoResult when no jobs match filter AFTER loading
          <div className="mt-8"> {/* Add margin to NoResult */}
            <NoResult
              title="No Jobs Found Matching Your Search"
              description="Try adjusting your keywords or location filters to discover more opportunities."
              link="/jobs" // Link to clear filters (removes query params)
              linkTitle="Clear Search Filters"
            />
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !isFetching && paginatedJobs.length > 0 && ( // Only show pagination if there are results
        <div className="mt-10 flex w-full items-center justify-center gap-3 sm:gap-4">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            size="sm" // Smaller pagination buttons
            variant="outline" // Use outline variant
            className="light-border-2 btn flex min-h-[36px] items-center justify-center gap-1.5 border rounded-lg disabled:opacity-50 px-3"
          >
            <Image src="/assets/icons/chevron-left.svg" alt="Previous" width={14} height={14} className="invert-colors"/>
            <span className="hidden sm:inline body-medium text-dark200_light800">Prev</span> {/* Hide text on mobile */}
          </Button>
          <div className="flex items-center justify-center rounded-md bg-primary-500 px-3.5 py-1.5">
            <p className="body-semibold text-light-900">{currentPage}</p>
          </div>
          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
             size="sm"
             variant="outline"
            className="light-border-2 btn flex min-h-[36px] items-center justify-center gap-1.5 border rounded-lg disabled:opacity-50 px-3"
          >
            <span className="hidden sm:inline body-medium text-dark200_light800">Next</span>
             <Image src="/assets/icons/chevron-right.svg" alt="Next" width={14} height={14} className="invert-colors"/>
          </Button>
        </div>
      )}
    </section>
  );
};

export default JobsPage;