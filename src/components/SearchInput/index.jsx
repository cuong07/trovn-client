import { CiLocationOn, CiSearch } from "react-icons/ci";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Search, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  deleteAllSearchHistory,
  deleteSearchHistory,
  getSearchHistories,
} from "@/apis/searchHistory";
import { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MdHistory } from "react-icons/md";
import { cn } from "@/utils/helpers";
import { deleteAmenityById } from "@/apis/amenities";
import { getLocations } from "@/apis/location";
import qs from "query-string";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import useListingStore from "@/hooks/useListingStore";
import useLocationStore from "@/hooks/useLocationStore";
import useMapStore from "@/hooks/useMapStore";
import { useNavigate } from "react-router-dom";
import useSearchStore from "@/hooks/useSearchStore";
import useUserStore from "@/hooks/useUserStore";
import { LazyLoadImage } from "react-lazy-load-image-component";

const Index = () => {
  // REACT HOOK
  const { locations, setLocations } = useLocationStore();

  const [keyword, setKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState(locations);
  // const [searchHistories, setSearchHistories] = useState(null);
  const { searchHistories } = useSearchStore();
  const [reload, setReload] = useState(false);
  const navigate = useNavigate();

  // CUSTOM HOOK
  const [debouncedKeyword] = useDebounce(keyword, 500);
  const { setSearchLatLng } = useMapStore();
  const { user } = useUserStore();
  const { setSearchListingKeyword, updateSearchListings, clearSearchFilter } =
    useListingStore();

  const handleSearch = () => {
    const queryParams = qs.stringify({ keyword: debouncedKeyword });
    setSearchListingKeyword(debouncedKeyword);
    navigate(`/search?${queryParams}`);
  };

  const handleClickSearchLocation = (location) => {
    clearSearchFilter();
    setSearchLatLng(location.latitude, location.longitude);
    updateSearchListings("locationId", location.id);
    navigate(`/search?${location.name} - ${location.city}`);
  };

  const handleChangeQuery = (e) => {
    setKeyword(e.target.value);
  };

  useEffect(() => {
    if (debouncedKeyword) {
      const fetchLocations = async () => {
        const { data } = await getLocations(1, 1000, debouncedKeyword);
        setSearchLocation(data?.contents);
        setLocations(data?.contents);
      };
      fetchLocations();
    } else {
      setSearchLocation(locations);
    }
  }, [debouncedKeyword]);

  const items = searchLocation?.map((item) => ({
    label: (
      <div className="flex gap-2 items-center cursor-pointer hover:bg-slate-100 p-2">
        <CiLocationOn size={22} />
        {`${item.name} - ${item.city}`}
      </div>
    ),
    value: item.id,
    native: item,
  }));

  const handleRemoveSearchHistory = async (id) => {
    try {
      const { status } = await deleteSearchHistory(id);
      if (status === 204) {
        setReload(!reload);
        toast.success("Xóa lịch sử tìm kiếm thành công");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  const handleRemoveAllSearchHistory = async () => {
    try {
      const { status } = await deleteAllSearchHistory();
      if (status === 204) {
        setReload(!reload);
        toast.success("Xóa tất cả lịch sử tìm kiếm thành công");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  const handleSelectedSearchKeyword = (keyword) => {
    const queryParams = qs.stringify({ keyword });
    navigate(`/search?${queryParams}`);
    setSearchListingKeyword(keyword);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Popover>
      <PopoverTrigger className="md:w-[80%] w-full">
        <div className="flex bg-gradient-to-r from-white to-gray-50/80 md:h-[56px] h-[46px] items-center gap-4 group shadow-lg hover:shadow-xl rounded-full overflow-hidden md:pl-6 w-full border border-gray-200/60 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm">
          <div className="text-base pl-4 text-left flex-1">
            <p className="text-gray-900 md:text-base text-sm font-medium">
              Tìm kiếm phòng trọ
            </p>
            <p className="text-gray-500 md:text-xs text-[11px] leading-tight mt-0.5">
              Khu vực • Tên • Địa chỉ • Tiện ích
            </p>
          </div>
          <Button
            type="primary"
            className={cn(
              "md:size-[56px] size-[46px] rounded-full h-full p-1 flex overflow-hidden gap-2 items-center bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
            )}
            onClick={handleSearch}
          >
            <CiSearch size={22} strokeWidth={2.5} className="text-white" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="md:min-w-[850px] min-w-[400px] rounded-3xl shadow-2xl border-0 p-0 bg-white/95 backdrop-blur-lg">
        <div className="p-8">
          <div className="grid md:grid-cols-2 grid-cols-1 gap-8">
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  <Search size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Tìm kiếm</h3>
              </div>
              <div className="relative">
                <Input
                  placeholder="Nhập địa chỉ, khu vực hoặc từ khóa..."
                  onChange={handleChangeQuery}
                  onKeyDown={handleKeyDown}
                  className="pl-12 h-12 rounded-xl border-gray-200 focus:border-primary/50 focus:ring-primary/20 bg-white/80 backdrop-blur-sm text-base"
                />
                <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <div className="flex items-center justify-between mt-6 mb-3">
                <div className="flex items-center gap-2">
                  <MdHistory className="text-gray-500" size={18} />
                  <span className="text-base font-medium text-gray-900">Lịch sử tìm kiếm</span>
                </div>
                {searchHistories?.length > 0 && (
                  <button
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-primary/5"
                    onClick={() => handleRemoveAllSearchHistory()}
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {searchHistories &&
                  searchHistories?.map((item) => (
                    <div
                      key={item.id}
                      className="flex group justify-between items-center p-3 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 rounded-xl transition-all duration-200 border border-transparent hover:border-primary/20"
                      onClick={() => handleSelectedSearchKeyword(item.content)}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="p-1.5 bg-gray-100 group-hover:bg-primary/10 rounded-lg transition-colors duration-200">
                          <MdHistory className="text-gray-500 group-hover:text-primary" size={16} />
                        </div>
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">{item.content}</span>
                      </div>
                      <Tooltip>
                        <TooltipContent>Xóa khỏi lịch sử</TooltipContent>
                        <TooltipTrigger asChild>
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSearchHistory(item.id);
                            }}
                          >
                            <X className="text-gray-400 hover:text-red-500" size={16} />
                          </button>
                        </TooltipTrigger>
                      </Tooltip>
                    </div>
                  ))}
                {!searchHistories?.length && (
                  <div className="space-y-1">
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 rounded-xl transition-all duration-200 group"
                      onClick={() => handleSelectedSearchKeyword("Phòng tại quận 8")}
                    >
                      <div className="p-1.5 bg-blue-50 group-hover:bg-blue-100 rounded-lg transition-colors duration-200">
                        <Search size={16} className="text-blue-500" />
                      </div>
                      <span className="text-gray-700 group-hover:text-blue-700 font-medium">Phòng tại quận 8</span>
                    </div>
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100/50 rounded-xl transition-all duration-200 group"
                      onClick={() => handleSelectedSearchKeyword("Phòng đẹp")}
                    >
                      <div className="p-1.5 bg-emerald-50 group-hover:bg-emerald-100 rounded-lg transition-colors duration-200">
                        <Search size={16} className="text-emerald-500" />
                      </div>
                      <span className="text-gray-700 group-hover:text-emerald-700 font-medium">Phòng đẹp</span>
                    </div>
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 rounded-xl transition-all duration-200 group"
                      onClick={() => handleSelectedSearchKeyword("Phòng cho 5 người")}
                    >
                      <div className="p-1.5 bg-purple-50 group-hover:bg-purple-100 rounded-lg transition-colors duration-200">
                        <Search size={16} className="text-purple-500" />
                      </div>
                      <span className="text-gray-700 group-hover:text-purple-700 font-medium">Phòng cho 5 người</span>
                    </div>
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/50 rounded-xl transition-all duration-200 group"
                      onClick={() => handleSelectedSearchKeyword("Phòng có TV")}
                    >
                      <div className="p-1.5 bg-orange-50 group-hover:bg-orange-100 rounded-lg transition-colors duration-200">
                        <Search size={16} className="text-orange-500" />
                      </div>
                      <span className="text-gray-700 group-hover:text-orange-700 font-medium">Phòng có TV</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl">
                  <CiLocationOn size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Khu vực phổ biến</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {locations?.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleClickSearchLocation(item)}
                    className="group cursor-pointer bg-white/60 hover:bg-white/90 rounded-2xl p-4 border border-gray-100 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="relative overflow-hidden rounded-xl mb-3">
                      <LazyLoadImage
                        effect="blur"
                        src="/location.jpg"
                        alt="location"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CiLocationOn size={16} className="text-primary flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors duration-200 truncate">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Index;
