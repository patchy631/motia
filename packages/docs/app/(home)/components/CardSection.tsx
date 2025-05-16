import Image from 'next/image';
import Typography from '@/components/Typography';
import card from './images/card.png'

export default function CardSection() {
  return (
    <section className="py-16 md:py-24 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Card Image */}
          <div className="relative">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -top-4 -left-4 right-4 bottom-4 rounded-xl opacity-50"></div>
              <div className="relative">
                <Image
                  src={card}
                  placeholder="blur"
                  alt="Motia Dashboard"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority
                  quality={85}
                  loading="eager"
                />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div>
            <div className="inline-block border border-purple-300/30 rounded-md px-3 py-1 text-sm text-white/70 mb-6">
              Coming soon
            </div>
            
            <Typography 
              variant="title" 
              as="h2" 
              className="mb-4 text-left"
            >
              Scale with <span className="text-purple-300">MotiaHub</span>
            </Typography>
            
            <Typography 
              variant="description" 
              as="p" 
              className="mb-12 text-left max-w-xl"
            >
              Production-ready workflows without the infrastructure overhead.
            </Typography>
            
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="shrink-0 mr-4">
                  <Image 
                    src="/icons/matches-fire.svg" 
                    alt="Zero Config Icon" 
                    width={28} 
                    height={28}
                    sizes="28px"
                    className="w-7 h-7"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#E9DFFF] mb-1">Zero Config Deployment</h3>
                  <p className="text-[#CDBCF0]">Push to deploy from your repo</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="shrink-0 mr-4">
                  <Image 
                    src="/icons/monitor-heart-desktop.svg" 
                    alt="Monitoring Icon" 
                    width={28} 
                    height={28}
                    sizes="28px"
                    className="w-7 h-7"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#E9DFFF] mb-1">Real-Time Monitoring</h3>
                  <p className="text-[#CDBCF0]">Track execution, logs, and metrics</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="shrink-0 mr-4">
                  <Image 
                    src="/icons/workflow-teamwork.svg" 
                    alt="Team Collaboration Icon" 
                    width={28} 
                    height={28}
                    sizes="28px"
                    className="w-7 h-7"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#E9DFFF] mb-1">Team Collaboration</h3>
                  <p className="text-[#CDBCF0]">Share flows and debug together</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 