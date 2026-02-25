// 朋友圈 JS 代码
let isInitialized = false
let boundary = 15
let error_img = 'https://fastly.jsdelivr.net/gh/Rock-Candy-Tea/Friend-Circle-Frontend/logo.png'

// 初始化函数
export function initFriendCircle() {
  const UserConfig = window.UserConfig || {}
  boundary = UserConfig.page_turning_number || 15
  const private_api_url = UserConfig.private_api_url || 'https://circle-of-friends-iota.vercel.app/'
  error_img =
    UserConfig.error_img ||
    'https://fastly.jsdelivr.net/gh/Rock-Candy-Tea/Friend-Circle-Frontend/logo.png'

  const fdatalist = document.getElementById('friend-circle-lite-root')
  if (!fdatalist) return

  fdatalist.innerHTML = ''

  fetch(private_api_url + 'all')
    .then((res) => res.json())
    .then((json) => {
      const article_list = json.article_data || json || []
      if (!Array.isArray(article_list)) {
        console.error('API 返回格式错误:', json)
        throw new Error('API 返回格式错误')
      }
      const article_sort_list = article_list.sort(function (a, b) {
        return Date.parse(b.created) - Date.parse(a.created)
      })
      loadArticleItem(fdatalist, article_sort_list, 0, boundary)
    })
    .catch((err) => {
      console.error('朋友圈加载失败:', err)
      if (fdatalist)
        fdatalist.innerHTML =
          '<div style="text-align:center;padding:20px;">加载失败，请检查配置或网络</div>'
    })
}

// 加载文章项
function loadArticleItem(container, datalist, start, end) {
  let articleItem = ''
  const endPos = end > datalist.length ? datalist.length : end

  for (let i = start; i < endPos; i++) {
    const item = datalist[i]
    const created = item.created.slice(0, 10) // YYYY-MM-DD
    const author = item.author
    const title = item.title
    const link = item.link
    const avatar = item.avatar || error_img

    // 尝试从 link 中提取主域名作为作者链接
    let authorLink = '#'
    try {
      const urlObj = new URL(link)
      authorLink = urlObj.origin
    } catch (e) {
      console.warn('Invalid URL:', link)
    }

    articleItem += `
      <div class="card" onclick="window.open('${link}', '_blank')">
        <a href="${link}" target="_blank" class="card-title" title="${title}" onclick="event.stopPropagation()">${title}</a>
        <div class="card-author" title="访问 ${author} 的站点" onclick="event.stopPropagation(); window.open('${authorLink}', '_blank')">
          <img src="${avatar}" alt="${author}" onerror="this.src='${error_img}'">
          <span>${author}</span>
        </div>
        <div class="card-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar" style="margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${created}
        </div>
        <img class="card-bg" src="${avatar}" onerror="this.src='${error_img}'">
      </div>
    `
  }

  const div = document.createElement('div')
  div.className = 'articles-container'
  div.innerHTML = articleItem
  container.appendChild(div)

  let loadMoreBtn = document.getElementById('load-more-btn')
  if (loadMoreBtn) loadMoreBtn.remove()

  if (end < datalist.length) {
    loadMoreBtn = document.createElement('div')
    loadMoreBtn.id = 'load-more-btn'
    loadMoreBtn.innerText = '加载更多'
    container.parentNode.appendChild(loadMoreBtn) // Append after root (or inside root depending on layout)

    loadMoreBtn.onclick = function () {
      loadArticleItem(container, datalist, end, end + boundary)
    }
  }
}

initFriendCircle()

document.addEventListener('swup:content:replace', initFriendCircle)
document.addEventListener('astro:page-load', initFriendCircle)
