
interface Job {
  id: number;
  title: string;
  company: string;
  year: string;
  jobType: string;
  mode: string;
  place: string;
  dateStart: string;
  dateEnd: string;
  tags: string[];
  desc: string;
  applyUrl: string;
  image?: string;
  approved: boolean;
}

interface JobCardProps {
  job: Job;
  isFavorite: boolean;
  onFavoriteToggle: (id: number) => void;
  onCardClick: (job: Job) => void;
}

export default function JobCard({ job, isFavorite, onFavoriteToggle, onCardClick }: JobCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div 
      className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={() => onCardClick(job)}
    >
      {/* 画像部分 */}
      <div className="h-32 sm:h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {job.image ? (
          <img 
            src={job.image} 
            alt={job.title}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
            <i className="ri-calendar-event-line text-4xl text-orange-300"></i>
          </div>
        )}
        
        {/* オーバーレイとお気に入りボタン */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(job.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 shadow-sm cursor-pointer"
        >
          <i className={`${isFavorite ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'} text-sm`}></i>
        </button>
        
        {/* 年度バッジ */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium text-white bg-orange-500/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            {job.year}卒
          </span>
        </div>
      </div>
      
      {/* コンテンツ部分 */}
      <div className="p-4 space-y-3">
        {/* タイトルと企業名 */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight mb-1">
            {job.title}
          </h3>
          <p className="text-gray-600 text-sm font-medium">{job.company}</p>
        </div>
        
        {/* 詳細情報 */}
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <i className="ri-briefcase-line mr-2 text-orange-500"></i>
            <span className="font-medium">{job.jobType}</span>
            <span className="mx-2">•</span>
            <i className="ri-global-line mr-1 text-orange-500"></i>
            <span>{job.mode}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <i className="ri-map-pin-line mr-2 text-orange-500"></i>
            <span className="truncate flex-1">{job.place}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <i className="ri-calendar-line mr-2 text-orange-500"></i>
            <span>
              {formatDate(job.dateStart)}
              {job.dateStart !== job.dateEnd && ` - ${formatDate(job.dateEnd)}`}
            </span>
          </div>
        </div>
        
        {/* タグ */}
        <div className="flex flex-wrap gap-1">
          {job.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index} 
              className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{job.tags.length - 3}
            </span>
          )}
        </div>
        
        {/* 説明文 */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {job.desc}
        </p>
        
        {/* アクションボタン */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">詳細を見る</span>
            <i className="ri-arrow-right-line text-orange-500 text-sm group-hover:translate-x-1 transition-transform duration-200"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
