# 通过 chr() 生成符号以避开某些 Python 版本的代理对编码问题
SPARKLES = chr(0x2728)
GLOWING_STAR = chr(0x1F31F)
PACKAGE = chr(0x1F4E6)
MAG = chr(0x1F52C)
CHART = chr(0x1F4CA)
MONEY = chr(0x1F4B0)
STAR = chr(0x2B50)
CHECK = chr(0x2705)
TROPHY = chr(0x1F3C6)
SPEECH = chr(0x1F4AC)
CART = chr(0x1F6D2)
ONE = chr(0x0031) + chr(0xFE0F) + chr(0x20E3)
TWO = chr(0x0032) + chr(0xFE0F) + chr(0x20E3)
THREE = chr(0x0033) + chr(0xFE0F) + chr(0x20E3)
RMB = chr(0x00A5)
LSQB = chr(0x3010)
RSQB = chr(0x3011)
LPAREN_S = chr(0xFF08)
RPAREN_S = chr(0xFF09)
EMDASH = chr(0x2014)

class ContentGenerator:
    _TAG_SETS = {
        "image_text": ["#好物推荐", "#种草笔记", "#品质生活", "#今日推荐"],
        "script": ["#短视频脚本", "#口播", "#好物推荐"],
        "review": ["#深度测评", "#好物测评", "#品质推荐"],
        "plot": ["#剧情植入", "#短剧", "#好物推荐"],
        "compare": ["#对比测评", "#选购指南", "#性价比"],
    }

    @classmethod
    def _join(cls, parts):
        return chr(10).join(parts)

    @classmethod
    def _t_image_text(cls, title, price):
        return cls._join([
            SPARKLES + " " + title + "｜姐妹们真的不能错过！",
            "",
            GLOWING_STAR + " 为什么推荐它？",
            ONE + " 真的超级好用！用完立刻回购",
            TWO + " 成分安全温和，敏感肌也完全 OK",
            THREE + " 性价比超高，学生党也能轻松入手",
            "",
            MONEY + " 使用小技巧：每次取适量，轻轻拍打至完全吸收，坚持一个月状态肉眼可见的变好！",
            "",
            CHART + " 使用 28 天后的真实感受：水润度提升，细腻度变好，整体气色明显改善",
            "",
            "姐妹们！真的强烈安利给每一位看到这篇笔记的宝宝~ 早买早享受！" + SPARKLES,
        ])

    @classmethod
    def _t_script(cls, title, price):
        q = chr(34)
        return cls._join([
            LSQB + "开场 3s 抓眼球" + RSQB,
            q + "姐妹们！这个真的是我今年用到最惊艳的东西，没有之一！" + q,
            "",
            LSQB + "产品展示" + RSQB,
            "- 镜头对准 " + title,
            "- 展示核心功能和效果",
            "- 对比使用前后",
            "",
            LSQB + "核心卖点" + RSQB,
            CHECK + " 效果看得见",
            CHECK + " 价格很亲民 " + RMB + str(price),
            CHECK + " 大牌同厂",
            CHECK + " 售后有保障",
            "",
            LSQB + "转化引导" + RSQB,
            q + "真的，我已经回购 3 次了！现在点左下角小黄车，还有限时折扣！" + q,
            "",
            q + "关注我，每天分享真实好用的平价好物~" + q,
        ])

    @classmethod
    def _t_review(cls, title, price):
        return cls._join([
            LSQB + title + " | 30 天深度测评" + RSQB,
            "",
            PACKAGE + " 开箱体验：包装非常精致，开箱有仪式感，送礼也很合适",
            "",
            MAG + " 成分分析：核心成分优质原料，含量充足，无香精酒精防腐剂",
            "",
            CHART + " 使用效果：第 7 天吸收很快，第 14 天明显改善，第 21 天惊喜，第 30 天彻底爱上",
            "",
            MONEY + " 性价比：价格 " + RMB + str(price) + "，折算每天不到几块钱",
            "",
            STAR + " 综合评分：4.8 / 5.0，推荐给追求品质的你",
        ])

    @classmethod
    def _t_compare(cls, title, price):
        return cls._join([
            LSQB + title + " vs 同类产品 | 深度对比测评" + RSQB,
            "",
            "A 款：大牌经典款 " + RMB + "899",
            "B 款：网红爆款 " + RMB + "599",
            "C 款：今日主角 " + RMB + str(price),
            "",
            CHECK + " 成分安全：A " + STAR*4 + " | B " + STAR*4 + " | C " + STAR*5,
            CHECK + " 使用感受：A 略油腻 | B 吸收一般 | C 清爽秒吸收",
            CHECK + " 效果表现：A 1 个月见效 | B 不明显 | C 2 周肉眼可见",
            "",
            TROPHY + " 总结：综合评分 C > A > B，追求性价比闭眼入 C！",
        ])

    @classmethod
    def _t_plot(cls, title, price):
        return cls._join([
            LSQB + "场景一：办公室" + RSQB,
            LPAREN_S + "小美一脸疲惫地对着电脑" + RPAREN_S,
            "",
            "小美：唉，最近加班太多，状态都变差了...",
            "同事小丽：" + LPAREN_S + "凑近" + RPAREN_S + " 怎么啦？看起来状态不太好耶",
            "小美：天天熬夜，试了好多方法都没用",
            "同事小丽：" + LPAREN_S + "神秘一笑" + RPAREN_S + " 早说呀！给你推荐我一直在用的神器",
            "小美：什么呀？",
            "同事小丽：当当当当！就是这个" + EMDASH + EMDASH + title + "！",
            LPAREN_S + "特写产品" + RPAREN_S,
            "同事小丽：我用了 2 个月，你看我现在是不是多了？",
            "小美：真的啊！你整个人气色都不一样！",
            "同事小丽：成分很温和，效果真的看得见",
            "小美：那我也赶紧去买！在哪里下单？",
            "同事小丽：点左下角小黄车就可以啦！现在还有限时优惠~",
            "",
            LSQB + "结尾" + RSQB + "二人相视一笑，镜头切产品特写 + 购买链接",
            "字幕：遇见它，是今年最美丽的意外 " + SPARKLES,
        ])

    @classmethod
    def generate(cls, product, content_type, extra_prompt=""):
        title = getattr(product, "title", None) or getattr(product, "name", "精选商品")
        price = getattr(product, "price", None) or "299"
        aliases = {
            "image_text": "image_text", "copywriting": "image_text", "种草": "image_text",
            "script": "script", "口播": "script",
            "review": "review", "测评": "review",
            "plot_script": "plot", "剧情": "plot",
            "compare": "compare", "对比": "compare",
        }
        key = aliases.get(content_type, "image_text")
        if key == "image_text":
            body = cls._t_image_text(title, price)
        elif key == "script":
            body = cls._t_script(title, price)
        elif key == "review":
            body = cls._t_review(title, price)
        elif key == "compare":
            body = cls._t_compare(title, price)
        elif key == "plot":
            body = cls._t_plot(title, price)
        else:
            body = cls._t_image_text(title, price)
        title_out = SPARKLES + " " + title
        tags = cls._TAG_SETS.get(key, ["#好物推荐"])
        call_to_action = SPEECH + " 评论区告诉我你的看法，抽 3 位宝宝送小样~"
        cart_text = CART + " 点击左下角小黄车下单 " + title + "，限时优惠 " + RMB + str(price) + "！"
        return {"title": title_out, "body": body, "tags": tags, "call_to_action": call_to_action, "cart_text": cart_text}
