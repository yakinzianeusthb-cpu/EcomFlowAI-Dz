import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import DemoDataNotice from './DemoDataNotice';

export default function ContentCalendar() {

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  const posts = [
    { date: 5, type: 'TikTok', title: 'Unboxing Video', time: '18:00' },
    { date: 7, type: 'Facebook', title: 'Promo 48h', time: '10:00' },
    { date: 12, type: 'Instagram', title: 'Testimonial', time: '20:30' },
    { date: 15, type: 'TikTok', title: 'Product Demo', time: '19:00' },
  ];

  return (
    <div className="space-y-6">
      <DemoDataNotice />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-dz-emerald/20 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-dz-emerald" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-fg">Calendrier de Publication</h2>
            <p className="text-fg-muted">Planifiez votre contenu pour dominer le marché</p>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all font-medium text-sm">
          <Plus className="w-4 h-4" />
          Ajouter un Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 ui-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-fg">Mai 2026</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-fg/5 rounded-lg text-fg-muted transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-fg/5 rounded-lg text-fg-muted transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-fg/10 rounded-xl overflow-hidden border border-fg/10">
            {days.map(day => (
              <div key={day} className="bg-fg/[0.04] py-3 text-center text-xs font-semibold text-fg-faint">
                {day}
              </div>
            ))}
            {dates.map(date => {
              const dayPosts = posts.filter(p => p.date === date);
              return (
                <div 
                  key={date} 
                  className="bg-fg/5 min-h-[100px] p-2 hover:bg-fg/[0.07] transition-colors group relative"
                >
                  <span className="text-sm font-medium text-fg-muted group-hover:text-fg transition-colors">
                    {date}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayPosts.map((post, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "text-xs p-1.5 rounded-md border",
                          post.type === 'TikTok' ? "bg-fg/[0.04] border-pink-500/30 text-pink-400" :
                          post.type === 'Facebook' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                          "bg-purple-500/10 border-purple-500/30 text-purple-400"
                        )}
                      >
                        <span className="font-bold block">{post.type}</span>
                        <span className="truncate block opacity-80">{post.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="ui-card p-6">
            <h3 className="text-lg font-semibold text-fg mb-4">À venir aujourd'hui</h3>
            <div className="space-y-4">
              {posts.slice(0, 2).map((post, i) => (
                <div key={i} className="flex gap-4 p-4 bg-fg/5 rounded-xl border border-fg/5 hover:border-dz-emerald/30 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-dz-emerald/20 rounded-lg flex items-center justify-center text-dz-emerald font-bold shrink-0">
                    {post.time}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-fg group-hover:text-dz-emerald transition-colors">{post.title}</h4>
                    <p className="text-xs text-fg-muted mt-1">{post.type} • Algeria Audience</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-dz-emerald/20 to-teal-600/20 ui-card p-6 text-center">
            <Share2 className="w-8 h-8 text-dz-emerald mx-auto mb-3" />
            <h3 className="text-fg font-semibold mb-2">Partager avec l'équipe</h3>
            <p className="text-xs text-fg-muted mb-4">Exportez votre calendrier de contenu pour vos community managers.</p>
            <button className="w-full py-2 bg-fg/10 hover:bg-fg/20 text-fg rounded-lg transition-all text-sm font-medium">
              Générer Lien de Partage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
