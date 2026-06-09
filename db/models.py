from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, Boolean, JSON, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), nullable=False, comment="商品标题")
    external_id = Column(String(128), index=True, comment="平台商品ID")
    platform = Column(String(32), index=True, comment="douyin/wechat/taobao/jd/pdd")
    category = Column(String(128), index=True, comment="类目")
    price = Column(Float, default=0.0)
    original_price = Column(Float, default=0.0)
    commission_rate = Column(Float, default=0.0, comment="佣金比例%")
    commission_amount = Column(Float, default=0.0, comment="单件佣金")
    sales_count = Column(Integer, default=0, comment="销量")
    sales_growth = Column(Float, default=0.0, comment="销量增长率%")
    creator_count = Column(Integer, default=0, comment="达人数")
    rating = Column(Float, default=0.0, comment="评分")
    video_count = Column(Integer, default=0, comment="视频数")
    main_image_url = Column(String(1024), comment="主图URL")
    detail_url = Column(String(1024), comment="详情页URL")
    extra = Column(JSON, default=dict, comment="扩展字段")
    is_hot = Column(Boolean, default=False, index=True, comment="是否爆品")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    analysis = relationship("ProductAnalysis", back_populates="product", uselist=False)
    contents = relationship("Content", back_populates="product")
    images = relationship("ImageAsset", back_populates="product")
    videos = relationship("VideoAsset", back_populates="product")


class HotTopic(Base):
    __tablename__ = "hot_topics"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(256), nullable=False, index=True)
    source = Column(String(32), index=True, comment="douyin/weibo/baidu/wechat/xhs")
    heat_value = Column(Float, default=0.0, comment="热度值")
    heat_growth = Column(Float, default=0.0, comment="增长率%")
    category = Column(String(128), index=True)
    external_id = Column(String(128))
    rank = Column(Integer, default=0)
    extra = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ProductAnalysis(Base):
    __tablename__ = "product_analysis"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, index=True)
    pain_points = Column(JSON, default=list, comment="用户痛点")
    selling_points = Column(JSON, default=list, comment="卖点")
    use_scenarios = Column(JSON, default=list, comment="使用场景")
    target_audience = Column(JSON, default=list, comment="目标人群")
    buy_reasons = Column(JSON, default=list, comment="购买理由")
    advantages = Column(JSON, default=list, comment="竞争优势")
    emotion_triggers = Column(JSON, default=list, comment="情绪触发点")
    raw_response = Column(Text, comment="AI原始返回")
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="analysis")


class Content(Base):
    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    content_type = Column(String(32), index=True, comment="image_text/copywriting/script/review")
    platform = Column(String(32), index=True, comment="xhs/douyin/wechat/kuaishou")
    title = Column(String(512))
    body = Column(Text, nullable=False)
    call_to_action = Column(String(512), comment="评论引导")
    tags = Column(JSON, default=list)
    cart_text = Column(String(512), comment="挂车文案")
    raw_prompt = Column(Text)
    raw_response = Column(Text)
    status = Column(String(16), default="draft", index=True, comment="draft/used/archived")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product", back_populates="contents")
    images = relationship("ImageAsset", back_populates="content")


class ImageAsset(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), index=True, nullable=True)
    source_url = Column(String(1024))
    local_path = Column(String(512))
    image_type = Column(String(32), index=True, comment="main/detail/cover/composite")
    platform = Column(String(32), index=True)
    width = Column(Integer)
    height = Column(Integer)
    extra = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="images")
    content = relationship("Content", back_populates="images")


class VideoAsset(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    local_path = Column(String(512))
    duration = Column(Float, default=0.0)
    video_type = Column(String(32), index=True, comment="15s/30s/60s")
    platform = Column(String(32), index=True)
    audio_path = Column(String(512))
    srt_path = Column(String(512))
    script = Column(Text)
    extra = Column(JSON, default=dict)
    status = Column(String(16), default="ready", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product", back_populates="videos")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(32), index=True, comment="xhs/douyin/wechat/kuaishou")
    account_name = Column(String(128), index=True)
    username = Column(String(256))
    password = Column(String(256))
    cookie_path = Column(String(512))
    status = Column(String(16), default="active", index=True)
    extra = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class PublishRecord(Base):
    __tablename__ = "publish_records"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True)
    product_id = Column(Integer, index=True)
    content_id = Column(Integer, index=True)
    video_id = Column(Integer, index=True, nullable=True)
    platform = Column(String(32), index=True)
    title = Column(String(512))
    body = Column(Text)
    publish_type = Column(String(32), comment="image/video/both")
    status = Column(String(16), default="pending", index=True, comment="pending/success/failed")
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True, index=True)
    error_msg = Column(Text)
    external_post_id = Column(String(256))
    stats = Column(JSON, default=dict, comment="播放/点赞/评论等")
    created_at = Column(DateTime, default=datetime.utcnow)


class SalesStats(Base):
    __tablename__ = "sales_stats"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True)
    platform = Column(String(32), index=True)
    date = Column(String(16), index=True, comment="YYYY-MM-DD")
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    favorites = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    orders = Column(Integer, default=0)
    commission = Column(Float, default=0.0)
    roi = Column(Float, default=0.0)
    extra = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("idx_product_date", "product_id", "date"),)
