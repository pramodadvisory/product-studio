import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Briefcase, TrendingUp } from 'lucide-react';

export default function SimpleUserProfile() {
  return (
    <div className="container mx-auto px-4 py-24 md:px-6 lg:py-32 2xl:max-w-[1400px]">
      <div className="mx-auto max-w-3xl">
        <h3 className="text-lg font-semibold mb-6 text-white">Ideal Customer Profile</h3>
        {/* ICP Header */}
        <div className="flex items-center gap-x-3 mb-6">
          <Avatar className="size-16">
            <AvatarImage
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2667&auto=format&fit=crop&w=320&h=320&q=80"
              alt="Mid-market B2B SaaS"
            />
            <AvatarFallback>ICP</AvatarFallback>
          </Avatar>
          <div className="grow">
            <h1 className="text-lg font-medium text-white">Mid-Market B2B SaaS</h1>
            <p className="text-white text-sm">
              50-500 employees • $5M-$50M revenue
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 border-white/20 border-y py-6">
          <div className="border-r border-white/20">
            <p className="text-white text-sm">Company Size</p>
            <p className="text-lg font-semibold text-white">50-500</p>
          </div>
          <div className="border-r border-white/20">
            <p className="text-white text-sm">Annual Revenue</p>
            <p className="text-lg font-semibold text-white">$5M-$50M</p>
          </div>
          <div>
            <p className="text-white text-sm">Avg Team Size</p>
            <p className="text-lg font-semibold text-white">150+</p>
          </div>
        </div>

        {/* ICP Details */}
        <div className="mt-8">
          <p className="text-white text-sm">
            Mid-market B2B SaaS companies with 50-500 employees and annual revenue between $5M-$50M. These organizations have established product teams that need advanced analytics capabilities to drive product decisions and understand customer behavior across multiple touchpoints.
          </p>
          <p className="text-white mt-3 text-sm">
            They are looking for solutions that provide real-time insights, behavioral analysis, and predictive modeling without requiring extensive technical resources. These companies value integration capabilities, customization options, and cost-effective pricing models that scale with their growth.
          </p>

          {/* Key Attributes */}
          <ul className="mt-5 flex flex-col gap-y-3">
            <li>
              <a
                href="#"
                className="text-white hover:text-white flex items-center gap-x-2.5 text-sm transition-colors"
              >
                <Briefcase className="size-3.5" />
                Product-driven companies with established teams
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-white hover:text-white flex items-center gap-x-2.5 text-sm transition-colors"
              >
                <TrendingUp className="size-3.5" />
                High growth rate and market expansion focus
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-white hover:text-white flex items-center gap-x-2.5 text-sm transition-colors"
              >
                <Mail className="size-3.5" />
                Open to modern analytics solutions
              </a>
            </li>
          </ul>

          {/* Skills */}
          <div className="mt-6">
            <p className="text-sm font-medium mb-3 text-white">Skills</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30">Product Analytics</Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30">Data-Driven</Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30">Growth Focus</Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30">API Integration</Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30">Real-time Insights</Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30">Behavioral Analysis</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
