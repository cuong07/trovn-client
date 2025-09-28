import { useEffect, useState } from "react";
import { getAllBanners, updateBannerStatus } from "../../../apis/banner";
import { getUser } from "../../../apis/user";
import moment from "moment";
import { Button } from "@/components";
import { LuBadgeCheck } from "react-icons/lu";
import { Table } from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useModal } from "@/hooks/useModalStore";
import { MODAL_TYPE } from "@/enums";

const BannerList = () => {
  const [banners, setBanners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { onOpen } = useModal();
  const pageSize = 5;

  const loadData = async () => {
    try {
      const response = await getAllBanners();
      if (response.success && Array.isArray(response.data)) {
        const bannersWithUser = await Promise.all(
          response.data.map(async (banner) => {
            const user = await getUser(banner.userId);
            return { ...banner, user };
          })
        );
        setBanners(bannersWithUser);
      } else {
        console.error("Dữ liệu không hợp lệ:", response);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách banner:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (banner) => {
    try {
      await updateBannerStatus(banner.id, { isActive: false });
      loadData();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái banner:", error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenCreateBanner = () => {
    onOpen(MODAL_TYPE.CREATE_BANNER_MODAL);
  }

  const columns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 200,
      render: (user) => (
        <div className="flex items-center">
          <LazyLoadImage
            effect="blur"
            src={user.avatarUrl}
            className="w-10 h-10 rounded-full mr-2"
          />
          <div style={{ marginRight: "30px" }}>
            <div className="text-sm font-medium">{user.email}</div>
            <div className="text-xs text-black-500">
              {moment(user.createdAt).format("LL")}
            </div>
            {user?.isPremium && <LuBadgeCheck className="text-blue-500" />}
          </div>
        </div>
      ),
    },
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (imageUrl) => (
        <LazyLoadImage
          effect="blur"
          src={imageUrl}
          alt="Banner"
          style={{ width: "300px", height: "auto" }}
        />
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "fromDate",
      key: "fromDate",
      render: (fromDate) => moment(fromDate).format("LL"),
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "toDate",
      key: "toDate",
      render: (toDate) => moment(toDate).format("LL"),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => <span>{isActive ? "Active" : "Inactive"}</span>,
    },
    {
      title: "",
      key: "action",
      render: (_, banner) => (
        <Button onClick={() => handleToggleActive(banner)}>Chặn</Button>
      ),
    },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-4">Danh sách banner</h2>
          <div className="mb-4">Hiện có {banners.length} banner</div>
        </div>
        <div>
          <Button onClick={handleOpenCreateBanner} >Create baner</Button>
        </div>
      </div>
      <div className="banner-table-container">
        <Table
          dataSource={banners}
          columns={columns}
          pagination={{
            current: currentPage,
            total: banners.length,
            pageSize,
            position: ["bottomCenter"],
          }}
          onChange={handlePageChange}
          scroll={{ x: true }}
        />
      </div>
    </div>
  );
};

export default BannerList;
