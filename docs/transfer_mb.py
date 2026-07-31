# -*- coding: utf-8 -*-
"""
将记账明细 Excel 转换为目标 JSON 格式
依赖: pandas, openpyxl
"""

import pandas as pd
import json
from datetime import datetime, date

# ============================================================
# 1. 预设数据（账户、分类保持原样）
# ============================================================
PRESET_JSON = r"""
{"accounts":[{"name":"银行卡","balance":0,"icon":"💳","sort":1,"id":1},{"name":"支付宝","balance":0,"icon":"💳","sort":2,"id":2},{"name":"微信","balance":0,"icon":"💳","sort":3,"id":3},{"name":"现金","balance":0,"icon":"💳","sort":4,"id":4}],"categories":[{"type":"expense","parentId":null,"name":"居住","icon":"🏠","sort":1,"id":1},{"type":"expense","parentId":null,"name":"餐饮","icon":"🍽️","sort":2,"id":2},{"type":"expense","parentId":null,"name":"交通","icon":"🚗","sort":3,"id":3},{"type":"expense","parentId":null,"name":"购物","icon":"🛍️","sort":4,"id":4},{"type":"expense","parentId":null,"name":"休闲","icon":"🎭","sort":5,"id":5},{"type":"expense","parentId":null,"name":"家庭","icon":"👨‍👩‍👧","sort":6,"id":6},{"type":"expense","parentId":null,"name":"人情","icon":"🤝","sort":7,"id":7},{"type":"expense","parentId":null,"name":"特别","icon":"🧮","sort":8,"id":8},{"type":"expense","parentId":1,"name":"房租房贷","icon":"","sort":1,"id":9},{"type":"expense","parentId":1,"name":"生活缴费","icon":"","sort":2,"id":10},{"type":"expense","parentId":1,"name":"家居家装","icon":"","sort":3,"id":11},{"type":"expense","parentId":2,"name":"餐饮美食","icon":"","sort":1,"id":12},{"type":"expense","parentId":2,"name":"生鲜食材","icon":"","sort":2,"id":13},{"type":"expense","parentId":2,"name":"休闲食品","icon":"","sort":3,"id":14},{"type":"expense","parentId":3,"name":"公共交通","icon":"","sort":1,"id":15},{"type":"expense","parentId":3,"name":"汽车消费","icon":"","sort":2,"id":16},{"type":"expense","parentId":3,"name":"停车通行","icon":"","sort":3,"id":17},{"type":"expense","parentId":3,"name":"汽车加油","icon":"","sort":4,"id":18},{"type":"expense","parentId":3,"name":"汽车充电","icon":"","sort":5,"id":19},{"type":"expense","parentId":4,"name":"日用百货","icon":"","sort":1,"id":20},{"type":"expense","parentId":4,"name":"服饰装扮","icon":"","sort":2,"id":21},{"type":"expense","parentId":4,"name":"美妆护理","icon":"","sort":3,"id":22},{"type":"expense","parentId":4,"name":"数码家电","icon":"","sort":4,"id":23},{"type":"expense","parentId":5,"name":"虚拟消费","icon":"","sort":1,"id":24},{"type":"expense","parentId":5,"name":"文娱休闲","icon":"","sort":2,"id":25},{"type":"expense","parentId":5,"name":"兴趣潮玩","icon":"","sort":3,"id":26},{"type":"expense","parentId":5,"name":"运动健身","icon":"","sort":4,"id":27},{"type":"expense","parentId":5,"name":"旅游出行","icon":"","sort":5,"id":28},{"type":"expense","parentId":6,"name":"文化教育","icon":"","sort":1,"id":29},{"type":"expense","parentId":6,"name":"医疗保健","icon":"","sort":2,"id":30},{"type":"expense","parentId":6,"name":"宠物消费","icon":"","sort":3,"id":31},{"type":"expense","parentId":7,"name":"红包转账","icon":"","sort":1,"id":32},{"type":"expense","parentId":7,"name":"节日礼物","icon":"","sort":2,"id":33},{"type":"expense","parentId":8,"name":"订婚","icon":"","sort":1,"id":34},{"type":"expense","parentId":8,"name":"婚礼","icon":"","sort":2,"id":35},{"type":"expense","parentId":8,"name":"购车","icon":"","sort":3,"id":36},{"type":"expense","parentId":8,"name":"购房","icon":"","sort":4,"id":37},{"type":"expense","parentId":8,"name":"其它","icon":"","sort":5,"id":38},{"type":"income","parentId":null,"name":"主动收入","icon":"💼","sort":1,"id":39},{"type":"income","parentId":null,"name":"被动收入","icon":"💰","sort":2,"id":40},{"type":"income","parentId":null,"name":"其它收入","icon":"🎁","sort":3,"id":41},{"type":"income","parentId":39,"name":"税后薪酬","icon":"","sort":1,"id":42},{"type":"income","parentId":39,"name":"绩效奖金","icon":"","sort":2,"id":43},{"type":"income","parentId":39,"name":"兼职外包","icon":"","sort":3,"id":44},{"type":"income","parentId":40,"name":"利息分红","icon":"","sort":1,"id":45},{"type":"income","parentId":40,"name":"资本利得","icon":"","sort":2,"id":46},{"type":"income","parentId":41,"name":"转卖返现","icon":"","sort":1,"id":47},{"type":"income","parentId":41,"name":"红包转账","icon":"","sort":2,"id":48},{"type":"transfer","parentId":null,"name":"借入借出","icon":"🤝","sort":1,"id":49},{"type":"transfer","parentId":null,"name":"存钱账户","icon":"🏦","sort":2,"id":50},{"type":"transfer","parentId":null,"name":"理财账户","icon":"📈","sort":3,"id":51},{"type":"transfer","parentId":null,"name":"家庭账户","icon":"🏡","sort":4,"id":52},{"type":"transfer","parentId":49,"name":"借出/还款","icon":"","sort":1,"id":53},{"type":"transfer","parentId":49,"name":"借入/收款","icon":"","sort":2,"id":54},{"type":"transfer","parentId":50,"name":"存入","icon":"","sort":1,"id":55},{"type":"transfer","parentId":50,"name":"取出","icon":"","sort":2,"id":56},{"type":"transfer","parentId":51,"name":"买入","icon":"","sort":1,"id":57},{"type":"transfer","parentId":51,"name":"赎回","icon":"","sort":2,"id":58},{"type":"transfer","parentId":52,"name":"转入","icon":"","sort":1,"id":59},{"type":"transfer","parentId":52,"name":"转出","icon":"","sort":2,"id":60}],"transactions":[{"type":"expense","title":"早饭-麦当劳","amount":2400,"categoryId":12,"tags":["快餐"],"note":"满分早餐","date":"2026-07-31","time":"13:40","id":1}],"recurringRules":[],"quickTemplates":[]}
"""

preset = json.loads(PRESET_JSON)

# 构建分类映射: (type, name) -> id；以及 名称 -> id 的备选映射
category_map_by_type = {}      # (type, name) -> id
category_name_all = {}         # name -> [id1, id2, ...]
for c in preset['categories']:
    key = (c['type'], c['name'])
    category_map_by_type[key] = c['id']
    category_name_all.setdefault(c['name'], []).append((c['type'], c['id']))


# ============================================================
# 2. 工具函数
# ============================================================
def parse_date(val):
    """把各种日期格式统一成 YYYY-MM-DD"""
    if val is None:
        return None
    if isinstance(val, (datetime, date, pd.Timestamp)):
        return pd.Timestamp(val).strftime('%Y-%m-%d')
    if isinstance(val, float) and pd.isna(val):
        return None
    s = str(val).strip()
    if not s:
        return None
    # Excel 数字日期序列号
    if s.replace('.', '', 1).isdigit() and s.count('.') == 0:
        try:
            return pd.Timestamp('1899-12-30') + pd.Timedelta(days=float(s))
        except Exception:
            pass
    for fmt in ('%Y.%m.%d', '%Y-%m-%d', '%Y/%m/%d', '%Y年%m月%d日'):
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None


def parse_amount(val):
    """金额（元）-> 分；空值返回 None；0 保留"""
    if val is None:
        return None
    if isinstance(val, str):
        s = val.strip().replace(',', '').replace('，', '')
        if s == '':
            return None
        try:
            return int(round(float(s) * 100))
        except ValueError:
            return None
    if isinstance(val, (int, float)):
        if pd.isna(val):
            return None
        return int(round(float(val) * 100))
    return None


def parse_tags(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return []
    s = str(val).strip()
    if not s or s.lower() == 'nan':
        return []
    # 多种分隔符
    for sep in (',', '，', ';', '；', '|', '/', ' '):
        if sep in s:
            parts = [p.strip() for p in s.split(sep) if p.strip()]
            if parts:
                return parts
    return [s]


def to_str(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ''
    s = str(val).strip()
    return '' if s.lower() == 'nan' else s


def resolve_category_id(type_name, cat_name_raw):
    """根据类型和中文分类名查找 id；找不到返回 None"""
    name = to_str(cat_name_raw)
    if not name:
        return None
    # 1. 精确匹配 (type, name)
    if (type_name, name) in category_map_by_type:
        return category_map_by_type[(type_name, name)]
    # 2. 在该 type 下做名称包含匹配
    for (t, n), cid in category_map_by_type.items():
        if t == type_name and (n == name or name in n or n in name):
            return cid
    # 3. 全局名称匹配
    if name in category_name_all:
        return category_name_all[name][0][1]
    return None


# ============================================================
# 3. 处理单个 sheet
# ============================================================
def process_sheet(df, type_name, tx_counter):
    """处理一个 sheet，返回 transactions 列表"""
    transactions = []
    if df is None or df.empty:
        return transactions

    # 规范列名（去空白）
    df.columns = [to_str(c) for c in df.columns]

    # 统一使用别名查找列，兼容"分类"和"类别"
    col_aliases = {
        'date':   ['日期', 'date'],
        'title':  ['交易', '交易内容', '明细', 'title'],
        'cat':    ['分类', '类别', 'category'],
        'amount': ['金额', 'amount'],
        'note':   ['备注', '说明', 'note'],
        'tag':    ['标签', 'tags']
    }

    def find_col(preferred):
        for name in col_aliases[preferred]:
            if name in df.columns:
                return name
        return None

    c_date = find_col('date')
    c_title = find_col('title')
    c_cat = find_col('cat')
    c_amount = find_col('amount')
    c_note = find_col('note')
    c_tag = find_col('tag')

    if c_date is None or c_amount is None:
        print(f"  [警告] sheet 缺少必要列（日期/金额），跳过")
        return transactions

    # 合并单元格日期：前向填充
    df[c_date] = df[c_date].ffill()

    for _, row in df.iterrows():
        # 跳过完全空行
        if all((to_str(row.get(c)) == '') for c in df.columns):
            continue

        d = parse_date(row.get(c_date))
        if d is None:
            continue

        amount = parse_amount(row.get(c_amount))
        if amount is None:
            continue   # 金额为空 -> 丢弃；金额为 0 保留

        title = to_str(row.get(c_title)) if c_title else ''
        cat_name_raw = row.get(c_cat) if c_cat else None
        note = to_str(row.get(c_note)) if c_note else ''
        tags = parse_tags(row.get(c_tag)) if c_tag else []

        cat_id = resolve_category_id(type_name, cat_name_raw)
        if cat_id is None:
            # 找不到分类：打印警告但不丢弃
            print(f"  [警告] 未匹配到分类: type={type_name}, name={cat_name_raw!r}")

        # 标题为空时用分类名兜底
        if not title:
            title = to_str(cat_name_raw) or '未命名'

        transactions.append({
            'type': type_name,
            'title': title,
            'amount': amount,
            'categoryId': cat_id,
            'tags': tags,
            'note': note,
            'date': d,
            'time': '08:00',
            'id': tx_counter[0],
        })
        tx_counter[0] += 1

    return transactions


# ============================================================
# 4. 主流程
# ============================================================
def main(excel_path, output_path):
    print(f"读取 Excel: {excel_path}")
    xls = pd.ExcelFile(excel_path)
    print(f"sheet 列表: {xls.sheet_names}")

    tx_counter = [1]   # 自增 id
    all_tx = []

    # 收入
    if '收入' in xls.sheet_names:
        print("\n处理 [收入] sheet ...")
        df = pd.read_excel(xls, '收入')
        all_tx.extend(process_sheet(df, 'income', tx_counter))

    # 转账
    if '转账' in xls.sheet_names:
        print("\n处理 [转账] sheet ...")
        df = pd.read_excel(xls, '转账')
        all_tx.extend(process_sheet(df, 'transfer', tx_counter))

    # 各月份支出 sheet
    expense_sheets = sorted([s for s in xls.sheet_names
                             if s.startswith('2026.') or s.startswith('2026-')])
    for s in expense_sheets:
        print(f"\n处理 [{s}] 支出 sheet ...")
        df = pd.read_excel(xls, s)
        all_tx.extend(process_sheet(df, 'expense', tx_counter))

    # 组装结果
    result = {
        'accounts': preset['accounts'],
        'categories': preset['categories'],
        'transactions': all_tx,
        'recurringRules': [],
        'quickTemplates': [],
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 完成！共生成 {len(all_tx)} 条交易记录")
    print(f"输出文件: {output_path}")


if __name__ == '__main__':
    # 修改为你的实际文件路径
    EXCEL_PATH = '记账2026最新模板.xlsx'
    OUTPUT_PATH = 'output.json'
    main(EXCEL_PATH, OUTPUT_PATH)