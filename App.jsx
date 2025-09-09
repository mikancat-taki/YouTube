import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Search, ExternalLink, Play, Clock, Eye, ThumbsUp } from 'lucide-react'
import './App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [urlQuery, setUrlQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [urlResult, setUrlResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const API_KEY = 'YOUR_YOUTUBE_API_KEY'; // ここにYouTube APIキーを直接入力してください

  // YouTube API設定の確認
  const checkApiKey = () => {
    if (!API_KEY.trim() || API_KEY === 'YOUR_YOUTUBE_API_KEY') {
      setError('YouTube API キーが設定されていません。App.jsxにAPIキーを直接入力してください。')
      return false
    }
    setError('')
    return true
  }

  // 動画検索機能
  const searchVideos = async () => {
    if (!checkApiKey() || !searchQuery.trim()) {
      setError('検索キーワードを入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(searchQuery)}&type=video&key=${API_KEY}`
      )

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      // 動画の詳細情報を取得
      const videoIds = data.items.map(item => item.id.videoId).join(',')
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
      )

      const detailsData = await detailsResponse.json()
      
      // 検索結果と詳細情報をマージ
      const enrichedResults = data.items.map(item => {
        const details = detailsData.items.find(detail => detail.id === item.id.videoId)
        return {
          ...item,
          statistics: details?.statistics || {},
          contentDetails: details?.contentDetails || {}
        }
      })

      setSearchResults(enrichedResults)
    } catch (err) {
      setError(`検索エラー: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // URL解析機能
  const analyzeUrl = async () => {
    if (!checkApiKey() || !urlQuery.trim()) {
      setError('YouTube URLを入力してください')
      return
    }

    // YouTube URLからビデオIDを抽出
    const videoId = extractVideoId(urlQuery)
    if (!videoId) {
      setError('有効なYouTube URLを入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${API_KEY}`
      )

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      if (data.items.length === 0) {
        throw new Error('動画が見つかりませんでした')
      }

      setUrlResult(data.items[0])
    } catch (err) {
      setError(`URL解析エラー: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // YouTube URLからビデオIDを抽出
  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // 数値をフォーマット
  const formatNumber = (num) => {
    if (!num) return '0'
    const number = parseInt(num)
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M'
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K'
    }
    return number.toLocaleString()
  }

  // 時間をフォーマット
  const formatDuration = (duration) => {
    if (!duration) return '不明'
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return duration
    
    const hours = match[1] ? parseInt(match[1]) : 0
    const minutes = match[2] ? parseInt(match[2]) : 0
    const seconds = match[3] ? parseInt(match[3]) : 0
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
            <Play className="w-8 h-8" />
            YouTube検索アプリ
          </h1>
          <p className="text-gray-600">動画検索とURL解析ができるYouTubeアプリケーション</p>
        </div>



        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* メインコンテンツ */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              動画検索
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              URL解析
            </TabsTrigger>
          </TabsList>

          {/* 動画検索タブ */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>動画検索</CardTitle>
                <CardDescription>
                  キーワードでYouTube動画を検索します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="検索キーワードを入力..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={searchVideos} 
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {loading ? '検索中...' : '検索'}
                  </Button>
                </div>

                {/* 検索結果 */}
                <div className="grid gap-4">
                  {searchResults.map((video) => (
                    <Card key={video.id.videoId} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-80 flex-shrink-0">
                          <img
                            src={video.snippet.thumbnails.medium.url}
                            alt={video.snippet.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {video.snippet.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {video.snippet.channelTitle}
                          </p>
                          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                            {video.snippet.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {video.statistics.viewCount && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {formatNumber(video.statistics.viewCount)} 回視聴
                              </Badge>
                            )}
                            {video.statistics.likeCount && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {formatNumber(video.statistics.likeCount)}
                              </Badge>
                            )}
                            {video.contentDetails.duration && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(video.contentDetails.duration)}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id.videoId}`, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            YouTubeで視聴
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* URL解析タブ */}
          <TabsContent value="url">
            <Card>
              <CardHeader>
                <CardTitle>URL解析</CardTitle>
                <CardDescription>
                  YouTube URLから動画情報を取得します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="YouTube URLを入力..."
                    value={urlQuery}
                    onChange={(e) => setUrlQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && analyzeUrl()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={analyzeUrl} 
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {loading ? '解析中...' : '解析'}
                  </Button>
                </div>

                {/* URL解析結果 */}
                {urlResult && (
                  <Card className="overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      <div className="lg:w-96 flex-shrink-0">
                        <img
                          src={urlResult.snippet.thumbnails.high.url}
                          alt={urlResult.snippet.title}
                          className="w-full h-64 lg:h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <h2 className="font-bold text-xl mb-3">
                          {urlResult.snippet.title}
                        </h2>
                        <p className="text-gray-600 mb-2">
                          チャンネル: {urlResult.snippet.channelTitle}
                        </p>
                        <p className="text-gray-600 mb-4">
                          公開日: {new Date(urlResult.snippet.publishedAt).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-gray-700 mb-4">
                          {urlResult.snippet.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-2xl font-bold text-red-600">
                              {formatNumber(urlResult.statistics.viewCount)}
                            </div>
                            <div className="text-sm text-gray-600">視聴回数</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-2xl font-bold text-green-600">
                              {formatNumber(urlResult.statistics.likeCount)}
                            </div>
                            <div className="text-sm text-gray-600">高評価</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatNumber(urlResult.statistics.commentCount)}
                            </div>
                            <div className="text-sm text-gray-600">コメント</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-2xl font-bold text-purple-600">
                              {formatDuration(urlResult.contentDetails.duration)}
                            </div>
                            <div className="text-sm text-gray-600">再生時間</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => window.open(`https://www.youtube.com/watch?v=${urlResult.id}`, '_blank')}
                          className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          YouTubeで視聴
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App

