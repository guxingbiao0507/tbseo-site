import { count } from 'drizzle-orm'
import type { DB } from './index'
import { schema } from './index'
import { createClient } from '@libsql/client'

type D1Database = any

export async function needsSetup(db: DB): Promise<boolean> {
  const row = await db.select({ c: count() }).from(schema.users).get()
  return (row?.c ?? 0) === 0
}

export async function runInstall(db: DB, input: { name: string; email: string; passwordHash: string; siteName?: string; siteDescription?: string }, d1?: D1Database) {
  if (!(await needsSetup(db))) {
    throw createError({ statusCode: 403, statusMessage: '站点已初始化' })
  }

  const now = new Date()

  // Execute raw SQL. Use D1 binding on Cloudflare, libSQL client locally.
  async function rawExec(sql: string, params: any[]): Promise<{ lastInsertRowid: number; rows: any[] }> {
    if (d1) {
      const result = await d1.prepare(sql).bind(...params).all()
      return { lastInsertRowid: Number(result.meta.last_row_id), rows: result.results || [] }
    }
    const url = process.env.DATABASE_URL || `file:.data/${process.env.DATABASE_NAME || 'cms'}.sqlite`
    const raw = createClient({ url })
    const result = await raw.execute(sql, params)
    await raw.close()
    return { lastInsertRowid: Number(result.lastInsertRowid), rows: result.rows as any[] }
  }

  // Insert admin user
  const adminResult = await rawExec(
    `INSERT INTO cms_users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [input.name, input.email.toLowerCase(), input.passwordHash, 'admin']
  )
  const adminId = adminResult.lastInsertRowid

  const siteName = input.siteName || '无锡tbseo网络科技有限公司'
  const siteDescription = input.siteDescription || '专业搜索引擎优化与数字营销服务商，20年行业经验，3000+成功案例'

  // Settings use drizzle (no auto-increment issues)
  const defaultSettings: Record<string, string> = {
    siteName,
    siteDescription,
    footerText: `© ${now.getFullYear()} 无锡tbseo网络科技有限公司. 专业SEO优化服务商.`,
    companyPhone: '153-6521-5320',
    companyPhone2: '151-6157-3181',
    companyPhone3: '153-6529-7658',
    companyEmail: 'info@tbseo.com',
    companyAddress: '无锡市新吴区硕放中通路8号',
    companyHours: 'Mon-Fri 8:00-17:00',
    postsPerPage: '9',
    ga4MeasurementId: '',
    bingSiteVerification: '',
  }
  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } }).run()
  }

  // Product categories
  await rawExec(`INSERT INTO cms_product_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)`, ['滚筒输送机', 'gun-tong-shu-song-ji', '滚筒输送机系列产品', 1])
  await rawExec(`INSERT INTO cms_product_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)`, ['皮带输送机', 'pi-dai-shu-song-ji', '皮带输送机系列产品', 2])
  await rawExec(`INSERT INTO cms_product_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)`, ['链板输送机', 'lian-ban-shu-song-ji', '链板输送机系列产品', 3])
  await rawExec(`INSERT INTO cms_product_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)`, ['提升机', 'ti-sheng-ji', '提升机/升降机系列产品', 4])

  const catRoller = Number((await rawExec(`SELECT id FROM cms_product_categories WHERE slug = ?`, ['gun-tong-shu-song-ji'])).rows[0]?.id)
  const catBelt = Number((await rawExec(`SELECT id FROM cms_product_categories WHERE slug = ?`, ['pi-dai-shu-song-ji'])).rows[0]?.id)
  const catChain = Number((await rawExec(`SELECT id FROM cms_product_categories WHERE slug = ?`, ['lian-ban-shu-song-ji'])).rows[0]?.id)
  const catLift = Number((await rawExec(`SELECT id FROM cms_product_categories WHERE slug = ?`, ['ti-sheng-ji'])).rows[0]?.id)

  // Products
  const insertProduct = async (p: any) => {
    await rawExec(`INSERT INTO cms_products (name, slug, locale, description, content, cover_image, category_id, specs, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.slug, p.locale, p.description, p.content, p.coverImage || null, p.categoryId, p.specs, p.status, p.tags])
  }

  await insertProduct({ name: '重型链条滚筒输送机', slug: 'zhong-xing-lian-tiao-gun-tong-shu-song-ji', locale: 'cn', description: '重型链条滚筒输送机，适用于重载物料输送，承载能力强、运行平稳', content: '# 重型链条滚筒输送机\n\n重型链条滚筒输送机适用于重载物料的输送，具有承载能力强、运行平稳的特点。', coverImage: '/uploads/products/63a2bb04ebe7d.jpg', categoryId: catRoller, specs: '{"滚筒直径":"Φ50-Φ160mm","链板宽度":"200-1200mm","输送速度":"0.5-15m/min","电机功率":"0.37-7.5kW"}', status: 'published', tags: '滚筒输送机,重型,链条' })
  await insertProduct({ name: '刹车滚筒输送机', slug: 'sha-che-gun-tong-shu-song-ji', locale: 'cn', description: '刹车滚筒输送机，通过刹车装置实现物料精准定位', content: '# 刹车滚筒输送机\n\n刹车滚筒输送机通过刹车装置实现物料的精准定位，定位精度可达±2mm。', coverImage: '/uploads/products/63a2c426cc669.jpg', categoryId: catRoller, specs: '{"滚筒直径":"Φ50-Φ100mm","刹车方式":"电磁刹车","定位精度":"±2mm"}', status: 'published', tags: '滚筒输送机,刹车' })
  await insertProduct({ name: '分合流滚筒输送机', slug: 'fen-he-liu-gun-tong-shu-song-ji', locale: 'cn', description: '分合流滚筒输送机，实现物料分流与合流', content: '# 分合流滚筒输送机\n\n分合流滚筒输送机用于生产线的物料分流与合流，分流角度可选30°/45°/90°。', coverImage: '/uploads/products/63a2b9cd8f5a3.jpg', categoryId: catRoller, specs: '{"滚筒直径":"Φ60mm","分流角度":"30°/45°/90°"}', status: 'published', tags: '滚筒输送机,分合流' })
  await insertProduct({ name: '链条积放滚筒输送机', slug: 'lian-tiao-ji-fang-gun-tong-shu-song-ji', locale: 'cn', description: '链条积放滚筒输送机，积放功能实现物料缓存', content: '# 链条积放滚筒输送机\n\n具备积放功能，可实现物料的临时缓存，提高生产线灵活性。', coverImage: '/uploads/products/63a2ba6d16538.jpg', categoryId: catRoller, specs: '{"滚筒直径":"Φ50-Φ89mm","积放方式":"链条积放"}', status: 'published', tags: '滚筒输送机,积放' })
  await insertProduct({ name: '电动滚筒输送机', slug: 'dian-dong-gun-tong-shu-song-ji', locale: 'cn', description: '电动滚筒输送机，电机内置滚筒，结构紧凑', content: '# 电动滚筒输送机\n\n将电机和滚筒集成一体，结构紧凑，节省空间。', coverImage: '/uploads/products/63a2c55b5c9f2.jpg', categoryId: catRoller, specs: '{"滚筒直径":"Φ108-Φ219mm","功率":"0.37-2.2kW"}', status: 'published', tags: '滚筒输送机,电动' })
  await insertProduct({ name: '转弯滚筒输送机', slug: 'zhuan-wan-gun-tong-shu-song-ji', locale: 'cn', description: '转弯滚筒输送机，实现生产线转向', content: '# 转弯滚筒输送机\n\n用于生产线的转弯处，实现物料的平滑转向输送。', coverImage: '/uploads/products/63a2bca88aff1.jpg', categoryId: catRoller, specs: '{"转弯半径":"R300-R2000mm","转弯角度":"30°/45°/90°/180°"}', status: 'published', tags: '滚筒输送机,转弯' })
  await insertProduct({ name: '皮带驱动滚筒输送机', slug: 'pi-dai-qu-dong-gun-tong-shu-song-ji', locale: 'cn', description: '皮带驱动滚筒输送机，采用皮带传动方式，运行平稳安静', content: '# 皮带驱动滚筒输送机\n\n采用皮带传动方式，运行平稳安静，适用于精密产品输送。', coverImage: '/uploads/products/63a50ad5a07c6.png', categoryId: catRoller, specs: '{"皮带宽度":"200-800mm"}', status: 'published', tags: '滚筒输送机,皮带驱动' })
  await insertProduct({ name: '锥形滚筒输送机', slug: 'zhui-xing-gun-tong-shu-song-ji', locale: 'cn', description: '锥形滚筒输送机，锥形滚筒确保物料转弯不偏移', content: '# 锥形滚筒输送机\n\n锥形滚筒确保物料在转弯时不偏移，适用于转弯段。', coverImage: '/uploads/products/63a2bb9215089.jpg', categoryId: catRoller, specs: '{"锥形角度":"2°/3°"}', status: 'published', tags: '滚筒输送机,锥形' })
  await insertProduct({ name: '直行滚筒输送机', slug: 'zhi-xing-gun-tong-shu-song-ji', locale: 'cn', description: '直行滚筒输送机，标准直线输送，适用于各类箱包托盘', content: '# 直行滚筒输送机\n\n最基础的滚筒输送设备，适用于各类箱包托盘的直线输送。', coverImage: '/uploads/products/63a2593430dd2.jpg', categoryId: catRoller, specs: '{"滚筒直径":"Φ38-Φ89mm"}', status: 'published', tags: '滚筒输送机,直行' })
  // 皮带输送机
  await insertProduct({ name: '带隔断皮带输送机', slug: 'dai-ge-duan-pi-dai-shu-song-ji', locale: 'cn', description: '带隔断皮带输送机，在皮带上设置隔断，分区输送物料', content: '# 带隔断皮带输送机\n\n在皮带上设置隔断，可同时输送多种物料而不混淆。', coverImage: '/uploads/products/63a2c4b48ef90.jpg', categoryId: catBelt, specs: '{"皮带宽度":"300-1000mm"}', status: 'published', tags: '皮带输送机,隔断' })
  await insertProduct({ name: '转弯皮带输送机', slug: 'zhuan-wan-pi-dai-shu-song-ji', locale: 'cn', description: '转弯皮带输送机，用于皮带线的转弯段', content: '# 转弯皮带输送机\n\n用于皮带线的转弯段，实现物料在转弯处的平稳输送。', coverImage: '/uploads/products/63a2c4b502de4.jpg', categoryId: catBelt, specs: '{"皮带宽度":"200-800mm","转弯半径":"R500-R3000mm"}', status: 'published', tags: '皮带输送机,转弯' })
  await insertProduct({ name: '可拆卸皮带输送机', slug: 'ke-chai-xie-pi-dai-shu-song-ji', locale: 'cn', description: '可拆卸皮带输送机，设计为可快速拆装，适合灵活布置', content: '# 可拆卸皮带输送机\n\n设计为可快速拆装，适合灵活布置和多场景使用。', coverImage: '/uploads/products/63a2c4b49428a.jpg', categoryId: catBelt, specs: '{"皮带宽度":"300-800mm","输送长度":"3-20m"}', status: 'published', tags: '皮带输送机,可拆卸' })
  await insertProduct({ name: '槽型皮带输送机', slug: 'cao-xing-pi-dai-shu-song-ji', locale: 'cn', description: '槽型皮带输送机，采用槽型托辊，大倾角输送', content: '# 槽型皮带输送机\n\n采用槽型托辊，增加输送截面，适合大倾角输送。', coverImage: '/uploads/products/63a2c4b472abb.jpg', categoryId: catBelt, specs: '{"皮带宽度":"500-1400mm","槽角":"30°/35°/45°"}', status: 'published', tags: '皮带输送机,槽型' })
  await insertProduct({ name: '同步皮带输送机', slug: 'tong-bu-pi-dai-shu-song-ji', locale: 'cn', description: '同步皮带输送机，采用同步带传动，精确定位同步输送', content: '# 同步皮带输送机\n\n采用同步带传动，精确定位同步输送，适用于装配线。', coverImage: '/uploads/products/63a2c4b4f229b.jpg', categoryId: catBelt, specs: '{"同步带型号":"5M/8M/14M","定位精度":"±0.5mm"}', status: 'published', tags: '皮带输送机,同步' })
  await insertProduct({ name: '连接用防跑偏皮带机', slug: 'lian-jie-yong-fang-pao-pian-pi-dai-ji', locale: 'cn', description: '防跑偏皮带输送机，配备自动纠偏装置，防止皮带跑偏', content: '# 连接用防跑偏皮带机\n\n配备自动纠偏装置，防止皮带跑偏，确保稳定运行。', coverImage: '/uploads/products/63a2c4b4b7031.jpg', categoryId: catBelt, specs: '{"皮带宽度":"400-1200mm"}', status: 'published', tags: '皮带输送机,防跑偏' })
  // 链板输送机
  await insertProduct({ name: '链板输送机', slug: 'lian-ban-shu-song-ji', locale: 'cn', description: '链板输送机，采用链板作为承载面，适合重型物料', content: '# 链板输送机\n\n采用链板作为承载面，耐冲击、耐腐蚀，适合重型物料输送。', coverImage: '/uploads/products/63a25c0d0ae3d.jpg', categoryId: catChain, specs: '{"链板宽度":"200-1500mm"}', status: 'published', tags: '链板输送机' })
  await insertProduct({ name: '链条输送机', slug: 'lian-tiao-shu-song-ji', locale: 'cn', description: '链条输送机，采用链条传动，大载荷连续输送', content: '# 链条输送机\n\n采用链条传动，适合大载荷长距离连续输送。', coverImage: '/uploads/products/63a25b817894b.jpg', categoryId: catChain, specs: '{"链条规格":"08A-24A","最大载荷":"200kg/m"}', status: 'published', tags: '链条输送机' })
  await insertProduct({ name: '倍速链输送机', slug: 'bei-su-lian-shu-song-ji', locale: 'cn', description: '倍速链输送机，差速链实现积放，适用于装配线', content: '# 倍速链输送机\n\n采用差速链传动，适用于装配线，实现工位间差速输送。', coverImage: '/uploads/products/63a25ab78fddc.jpg', categoryId: catChain, specs: '{"链速比":"2:1/3:1"}', status: 'published', tags: '倍速链,装配线' })
  // 提升机
  await insertProduct({ name: '垂直提升机', slug: 'chui-zhi-ti-sheng-ji', locale: 'cn', description: '垂直提升机，连续垂直提升物料', content: '# 垂直提升机\n\n用于物料在垂直方向的连续提升，效率高、占地面积小。', coverImage: '/uploads/products/63a25cca9aeec.jpg', categoryId: catLift, specs: '{"提升高度":"1-10m","最大载荷":"100kg/件"}', status: 'published', tags: '提升机,垂直' })
  await insertProduct({ name: '液压升降台', slug: 'ye-ya-sheng-jiang-tai', locale: 'cn', description: '液压升降台，液压驱动平稳升降，大载荷', content: '# 液压升降台\n\n采用液压驱动，升降平稳，载荷范围500-5000kg。', coverImage: '/uploads/products/63a25d86afa0b.jpg', categoryId: catLift, specs: '{"升降高度":"0.5-6m","载荷":"500-5000kg"}', status: 'published', tags: '升降台,液压' })
  await insertProduct({ name: 'C型提升机', slug: 'c-xing-ti-sheng-ji', locale: 'cn', description: 'C型提升机，连续垂直提升，外形紧凑', content: '# C型提升机\n\n连续垂直提升物料，外形紧凑，适合空间有限场景。', coverImage: '/uploads/products/63a2c55b5c9f2.jpg', categoryId: catLift, specs: '{"提升高度":"2-8m","载荷":"单件50kg"}', status: 'published', tags: '提升机,C型' })
  await insertProduct({ name: 'Z型提升机', slug: 'z-xing-ti-sheng-ji', locale: 'cn', description: 'Z型提升机，入口出口水平方向，连续提升', content: '# Z型提升机\n\n入口和出口均为水平方向，适合楼层间垂直提升。', coverImage: '/uploads/products/63a2c55b479a0.jpg', categoryId: catLift, specs: '{"提升高度":"2-6m","载荷":"单件30kg"}', status: 'published', tags: '提升机,Z型' })

  // Post categories
  await rawExec(`INSERT INTO cms_categories (name, slug, description) VALUES (?, ?, ?)`, ['新闻资讯', 'news', '一番资讯新闻分类'])
  await rawExec(`INSERT INTO cms_categories (name, slug, description) VALUES (?, ?, ?)`, ['案例展示', 'cases', '客户案例展示分类'])

  const newsCat = Number((await rawExec(`SELECT id FROM cms_categories WHERE slug = ?`, ['news'])).rows[0]?.id)
  const casesCat = Number((await rawExec(`SELECT id FROM cms_categories WHERE slug = ?`, ['cases'])).rows[0]?.id)

  // News posts
  const insertPost = async (p: any) => {
    await rawExec(`INSERT INTO cms_posts (title, slug, excerpt, content, status, type, category_id, author_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.title, p.slug, p.excerpt, p.content, p.status, p.type, p.categoryId, p.authorId, p.tags])
  }

  await insertPost({ title: '解析滚筒输送机轴承使用注意事项', slug: 'jie-xi-gun-tong-shu-song-ji-zhou-cheng-shi-yong-zhu-yi-shi-xiang', excerpt: '滚筒输送机轴承是精密部件，使用不当则不会得到预期的高性能。', content: '# 解析滚筒输送机轴承使用注意事项\n\n滚筒输送机轴承是精密部件，使用不当则不会得到预期的高性能。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '滚筒输送机,轴承,保养' })
  await insertPost({ title: '当皮带式输送机的输送配件出现问题了怎么办', slug: 'dang-pi-dai-shi-shu-song-ji-de-shu-song-pei-jian-chu-xian-wen-ti-le-zen-me-ban', excerpt: '对于皮带式输送机的输送配件来说，有一些故障是比较常见的。', content: '# 当皮带式输送机的输送配件出现问题了怎么办\n\n对于皮带式输送机的输送配件来说，有一些故障是比较常见的。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '皮带输送机,故障,维修' })
  await insertPost({ title: '金属板链输送线怎么清洗', slug: 'jin-shu-ban-lian-shu-song-xian-zen-me-qing-xi', excerpt: '外表有污渍的金属链板输送机要定期整理。', content: '# 金属板链输送线怎么清洗\n\n外表有污渍的金属链板输送机要定期整理。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '链板输送机,清洗,维护' })
  await insertPost({ title: '皮带输送机安全保护装置介绍', slug: 'pi-dai-shu-song-ji-an-quan-bao-hu-zhuang-zhi-jie-shao', excerpt: '皮带输送机是生产企业中广泛应用的一种物料输送设备。', content: '# 皮带输送机安全保护装置介绍\n\n皮带输送机是生产企业中广泛应用的一种物料输送设备。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '皮带输送机,安全' })
  await insertPost({ title: '链板输送机对减速器的要求', slug: 'lian-ban-shu-song-ji-dui-jian-su-qi-de-yao-qiu', excerpt: '链板输送机是一种通用型固定式机械化输送设备。', content: '# 链板输送机对减速器的要求\n\n链板输送机是一种通用型固定式机械化输送设备。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '链板输送机,减速器' })
  await insertPost({ title: '链板输送机日常保养技巧', slug: 'lian-ban-shu-song-ji-ri-chang-bao-yang-ji-qiao', excerpt: '板链输送机的维护保养很重要。', content: '# 链板输送机日常保养技巧\n\n板链输送机的维护保养很重要。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '链板输送机,保养' })
  await insertPost({ title: '食品输送带要怎么选择', slug: 'shi-pin-shu-song-dai-yao-zen-me-xuan-ze', excerpt: '今天给大家带来的是PU输送带。', content: '# 食品输送带要怎么选择\n\n今天给大家带来的是PU输送带。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '食品输送带,PU' })
  await insertPost({ title: '为什么食品传送带选择PU传送带', slug: 'wei-shen-me-shi-pin-chuan-song-dai-xuan-ze-pu-chuan-song-dai', excerpt: 'PU输送带的材质是PU也称为聚氨酯。', content: '# 为什么食品传送带选择PU传送带\n\nPU输送带的材质是PU也称为聚氨酯。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '食品传送带,PU' })
  await insertPost({ title: '滚筒输送机定制应该注意什么', slug: 'gun-tong-shu-song-ji-ding-zhi-ying-gai-zhu-yi-shen-me', excerpt: '滚筒输送机结构简单，可靠性高。', content: '# 滚筒输送机定制应该注意什么\n\n滚筒输送机结构简单，可靠性高。', status: 'published', type: 'post', categoryId: newsCat, authorId: adminId, tags: '滚筒输送机,定制' })

  // Case posts
  await insertPost({ title: '江苏某木箱厂提升机', slug: 'jiang-su-mu-mu-xiang-ti-sheng-ji', excerpt: '为江苏某木箱厂定制提升机解决方案。', content: '# 江苏某木箱厂提升机\n\n为江苏某木箱厂定制提升机解决方案。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '提升机,木箱厂' })
  await insertPost({ title: '江苏某电子厂链板输送机', slug: 'jiang-su-dian-zi-chang-lian-ban-shu-song-ji', excerpt: '为江苏某电子厂提供链板输送机。', content: '# 江苏某电子厂链板输送机\n\n为江苏某电子厂提供链板输送机。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '链板输送机,电子厂' })
  await insertPost({ title: '江苏某电子厂倾斜皮带输送机', slug: 'jiang-su-dian-zi-chang-qing-xie-pi-dai-shu-song-ji', excerpt: '为江苏某电子厂定制倾斜皮带输送机。', content: '# 江苏某电子厂倾斜皮带输送机\n\n为江苏某电子厂定制倾斜皮带输送机。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '皮带输送机,电子厂' })
  await insertPost({ title: '上海某物流仓储滚筒输送线组', slug: 'shang-hai-wu-liu-cang-chu-gun-tong-shu-song-xian-zu', excerpt: '为上海某物流仓储中心提供滚筒输送线组。', content: '# 上海某物流仓储滚筒输送线组\n\n为上海某物流仓储中心提供滚筒输送线组。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '滚筒输送机,物流仓储' })
  await insertPost({ title: '上海某快递行业滚筒输送机', slug: 'shang-hai-kuai-di-xing-ye-gun-tong-shu-song-ji', excerpt: '为上海某快递分拣中心提供滚筒输送机方案。', content: '# 上海某快递行业滚筒输送机\n\n为上海某快递分拣中心提供滚筒输送机方案。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '滚筒输送机,快递' })
  await insertPost({ title: '江苏某液晶显示屏制造滚筒输送机', slug: 'jiang-su-ye-jing-xian-shi-pin-zhi-zao-gun-tong-shu-song-ji', excerpt: '为江苏某液晶显示屏制造企业定制滚筒输送机。', content: '# 江苏某液晶显示屏制造滚筒输送机\n\n为江苏某液晶显示屏制造企业定制滚筒输送机。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '滚筒输送机,液晶屏' })
  await insertPost({ title: '浙江某制造行业滚筒输送机', slug: 'zhe-jiang-zhi-zao-xing-ye-gun-tong-shu-song-ji', excerpt: '为浙江某制造企业提供滚筒输送机整体方案。', content: '# 浙江某制造行业滚筒输送机\n\n为浙江某制造企业提供滚筒输送机整体方案。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '滚筒输送机,制造' })
  await insertPost({ title: '江苏某食品行业皮带输送机', slug: 'jiang-shi-shi-pin-xing-ye-pi-dai-shu-song-ji', excerpt: '为江苏某食品企业定制食品级皮带输送机。', content: '# 江苏某食品行业皮带输送机\n\n为江苏某食品企业定制食品级皮带输送机。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '皮带输送机,食品行业' })
  await insertPost({ title: '江苏某化工行业皮带输送机', slug: 'jiang-su-hua-gong-xing-ye-pi-dai-shu-song-ji', excerpt: '为江苏某化工企业定制耐酸碱皮带输送机。', content: '# 江苏某化工行业皮带输送机\n\n为江苏某化工企业定制耐酸碱皮带输送机。', status: 'published', type: 'post', categoryId: casesCat, authorId: adminId, tags: '皮带输送机,化工' })

  // About page
  await rawExec(`INSERT INTO cms_posts (title, slug, excerpt, content, status, type, category_id, author_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['关于', 'about', 'TailorBoost – 您值得信赖的出海增长伙伴。',
    '# 关于\n\nTailorBoost 是一家拥有 15+ 年经验的专业 SEO 优化与数字营销服务商，已为全球数百家企业提供服务。',
    'published', 'page', null, adminId, ''])

  return { adminId }
}
