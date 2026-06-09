"""主入口脚本：演示完整流程"""
import sys
import argparse
from pathlib import Path

# 确保项目根目录在 Python 路径
sys.path.insert(0, str(Path(__file__).parent))

from loguru import logger
from db import init_db, get_db, Product, Account
from agents import (
    MarketingPipeline,
    ContentFactory,
    ImageRecomposer,
    VideoComposer,
    VideoChannelPublisher,
)


def init_database():
    logger.info("初始化数据库...")
    init_db()
    logger.success("数据库初始化完成")


def add_demo_product(
    title: str = "【爆品】2024夏季防晒衣女防紫外线冰丝轻薄外套",
    price: float = 59.9,
    commission_rate: float = 30.0,
    sales_count: int = 10000,
    category: str = "女装/女士精品",
    platform: str = "wechat",
    main_image_url: str = "",
) -> Product:
    with get_db() as db:
        p = Product(
            title=title,
            price=price,
            commission_rate=commission_rate,
            sales_count=sales_count,
            category=category,
            platform=platform,
            main_image_url=main_image_url,
            is_hot=True,
        )
        db.add(p)
        db.commit()
        db.refresh(p)
    logger.success(f"商品入库: [{p.id}] {p.title}")
    return p


def add_demo_account(
    account_name: str = "演示视频号",
    platform: str = "wechat",
) -> Account:
    with get_db() as db:
        a = db.query(Account).filter(
            Account.platform == platform,
            Account.account_name == account_name,
        ).first()
        if not a:
            a = Account(
                platform=platform,
                account_name=account_name,
                username="",
                password="",
                status="active",
            )
            db.add(a)
            db.commit()
            db.refresh(a)
    logger.success(f"账号入库: [{a.id}] {a.account_name} ({a.platform})")
    return a


def run_pipeline(product_id: int, with_video: bool = False, with_publish: bool = False,
                  account_id: int = None):
    """运行完整流水线"""
    with get_db() as db:
        product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        logger.error(f"商品 {product_id} 不存在")
        return

    pipeline = MarketingPipeline(product)
    pipeline.step_analyze()
    pipeline.step_generate_content(platforms=["xhs", "wechat"])
    pipeline.step_download_images()
    pipeline.step_compose_images(platform="wechat")

    if with_video:
        pipeline.step_compose_video(duration=30)

    logger.info("Pipeline results:")
    for k, v in pipeline.results.items():
        if k == "video_asset":
            logger.info(f"  {k}: {v.local_path if v else None}")
        elif k not in ("contents", "downloaded_images", "composed_images"):
            logger.info(f"  {k}: {str(v)[:100]}")

    logger.success(f"流程完成！商品: {product.title[:40]}")

    if with_publish and account_id:
        result = pipeline.step_publish_video(account_id)
        logger.info(f"发布结果: {result}")


def cmd_generate_content(product_id: int, platform: str = "xhs"):
    with get_db() as db:
        product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        logger.error(f"商品 {product_id} 不存在")
        return
    factory = ContentFactory()
    if platform == "xhs":
        content = factory.generate_xhs_post(product)
    else:
        content = factory.generate_video_script(product, duration=30)
    if content:
        logger.success(f"文案生成成功 (ID={getattr(content, 'id', 'N/A')})")
        print(getattr(content, "title", ""))
        print(getattr(content, "body", "")[:300])


def cmd_compose_images(product_id: int, platform: str = "wechat"):
    with get_db() as db:
        product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        logger.error(f"商品 {product_id} 不存在")
        return
    recomposer = ImageRecomposer(product)
    recomposer.download_assets()
    paths = recomposer.compose_for_platform(platform)
    logger.success(f"生成 {len(paths)} 张 {platform} 图文: {paths}")


def cmd_compose_video(product_id: int, duration: int = 30):
    with get_db() as db:
        product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        logger.error(f"商品 {product_id} 不存在")
        return
    factory = ContentFactory()
    script = factory.generate_video_script(product, duration=duration)
    if not script:
        logger.error("脚本生成失败")
        return
    composer = VideoComposer(product)
    asset = composer.compose_from_script(script, platform="wechat")
    if asset:
        logger.success(f"视频合成成功: {asset.local_path}")


def main():
    parser = argparse.ArgumentParser(description="AI带货系统 - 营销 Agent")
    parser.add_argument("--init", action="store_true", help="初始化数据库")
    parser.add_argument("--demo", action="store_true", help="添加演示商品和账号")
    parser.add_argument("--pipeline", action="store_true", help="运行完整流水线")
    parser.add_argument("--product-id", type=int, default=1, help="商品ID")
    parser.add_argument("--account-id", type=int, default=1, help="账号ID")
    parser.add_argument("--with-video", action="store_true", help="包含视频合成")
    parser.add_argument("--with-publish", action="store_true", help="包含发布")
    parser.add_argument("--platform", default="wechat", choices=["xhs", "wechat", "douyin", "kuaishou"])
    parser.add_argument("--duration", type=int, default=30, help="视频时长(秒)")
    parser.add_argument("--cmd", choices=["pipeline", "content", "images", "video"],
                        help="单独运行某个命令")
    args = parser.parse_args()

    if args.init:
        init_database()
        return

    if args.demo:
        init_database()
        add_demo_product()
        add_demo_account()
        return

    if args.cmd == "pipeline" or args.pipeline:
        run_pipeline(
            args.product_id,
            with_video=args.with_video,
            with_publish=args.with_publish,
            account_id=args.account_id,
        )
    elif args.cmd == "content":
        cmd_generate_content(args.product_id, args.platform)
    elif args.cmd == "images":
        cmd_compose_images(args.product_id, args.platform)
    elif args.cmd == "video":
        cmd_compose_video(args.product_id, args.duration)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
