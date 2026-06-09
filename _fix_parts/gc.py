@api_router.post("/api/actions/generate_content")
def generate_content_action(body: dict):
    try:
        product_id = body.get("product_id")
        content_type = body.get("content_type", "image_text")
        extra_prompt = body.get("prompt", "") or ""
        if not product_id:
            raise HTTPException(status_code=400, detail={"error": "缺少 product_id"})
        with get_db() as db:
            product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail={"error": "商品 #" + str(product_id) + " 不存在"})
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        content_obj = None
        used_local_fallback = False
        llm_error = None
        try:
            from agents.content_factory import ContentFactory
            factory = ContentFactory()
            if content_type in ("image_text", "copywriting", "种草"):
                content_obj = factory.generate_xhs_post(product)
            elif content_type in ("script", "口播"):
                result = factory.generate_video_script(product)
                if result:
                    with get_db() as db2:
                        content_obj = db2.query(Content).filter(Content.id == result["content_id"]).first()
            elif content_type in ("review", "测评"):
                content_obj = factory.generate_review(product)
            elif content_type in ("剧情", "plot_script"):
                content_obj = factory.generate_story_script(product)
            elif content_type in ("对比", "compare"):
                content_obj = factory.generate_compare(product)
            else:
                content_obj = factory.generate_xhs_post(product)
        except Exception as _e_llm:
            llm_error = str(_e_llm)
            content_obj = None
        local_result = None
        if not content_obj:
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)
            try:
                with get_db() as db3:
                    _tags_val = local_result["tags"]
                    _tags_str = ",".join(_tags_val) if isinstance(_tags_val, list) else str(_tags_val)
                    new_c = Content(product_id=product_id, title=local_result["title"], body=local_result["body"], platform="xhs", content_type=content_type, tags=_tags_str)
                    db3.add(new_c); db3.commit(); db3.refresh(new_c)
                    content_obj = new_c
            except Exception:
                content_obj = None
        if content_obj:
            _tags = getattr(content_obj, "tags", None)
            if isinstance(_tags, str):
                _tags_out = [t for t in _tags.split(",") if t]
            elif isinstance(_tags, list):
                _tags_out = _tags
            else:
                _tags_out = local_result["tags"] if used_local_fallback and local_result else ["#推荐"]
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": getattr(content_obj, "id", None),
                    "title": getattr(content_obj, "title", None) or (local_result["title"] if used_local_fallback and local_result else ""),
                    "body": getattr(content_obj, "body", None) or (local_result["body"] if used_local_fallback and local_result else ""),
                    "platform": getattr(content_obj, "platform", "xhs"),
                    "content_type": getattr(content_obj, "content_type", content_type),
                    "tags": _tags_out,
                    "call_to_action": local_result.get("call_to_action") if used_local_fallback and local_result else None,
                    "cart_text": local_result.get("cart_text") if used_local_fallback and local_result else None,
                },
            }
        else:
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": None, "title": local_result["title"], "body": local_result["body"],
                    "platform": "xhs", "content_type": content_type, "tags": local_result["tags"],
                    "call_to_action": local_result["call_to_action"], "cart_text": local_result["cart_text"],
                },
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_content_action failed: " + str(e))
        raise HTTPException(status_code=500, detail={"error": str(e)})
