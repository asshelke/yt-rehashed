import './styles/App.css';
import React, { useState } from 'react';
import Logo from './components/Logo';
import LinkForm from './components/LinkForm';
import Loader from './components/Loader';
import VideoPlayer from './components/VideoPlayer';
import CommentSection from './components/CommentSection';
import SummaryBox from './components/SummaryBox';
import DownloadModal from './components/DownloadModal';

// Access Vercel environment variable in production to reach deployed backend server on Railway
const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:8000';

function App() {
  const [inputLink, setLink] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [comments, setComments] = useState([]);
  const [videoSummary, setVideoSummary] = useState("");
  const [commentSummary, setCommentSummary] = useState("");
  const [summaryLoader, setSummaryLoader] = useState(false);

  const [downloadModal, setDownloadModal] = useState(false);
  const [downloadLoader, setDownloadLoader] = useState(false);
  const [downloadResolutions, setDownloadResolutions] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
  * Generate summaries for a YouTube video based on the provided URL.
  *
  * This function is triggered by clicking the submit button for the link form. 
  * It fetches summaries from the server generated by ChatGPT and updates state
  * hooks with the fetched data.
  */
  const generateSummaries = async (e) => {
    e.preventDefault();
    const videoUrl = inputLink;

    // clear relevant state hooks
    setLink("");
    setVideoId("");
    setVideoTitle("");
    setComments("")
    setVideoSummary("");
    setCommentSummary("");
    setDownloadResolutions("");
    setSelectedResolution("");
    setSummaryLoader(true);

    fetch(PROXY_URL + `/api/get-summaries?video_url=${videoUrl}`)
      .then(response => response.json()
      .then(data => ({ status: response.status, body: data })))
      .then(({ status, body }) => {
        if (status !== 200) {
          throw new Error(body.error);
        }

        // initalize relevant state hooks
        setSummaryLoader(false);
        setVideoId(body.video_id);
        setVideoTitle(body.video_title);
        setComments(body.comments);
        setVideoSummary(body.video_summary);
        setCommentSummary(body.comments_summary);
      })
      .catch(error => {
        if (error.message === "Failed to fetch") {
          error.message = "The servers are currently down. Please try again later.";
        }
        setSummaryLoader(false);
        window.alert(error.message);
      });
  };

  /**
  * Display the available resolutions to download for the given YouTube video.
  *
  * This function is triggered by opening up the download modal for the first
  * time for the current video. It fetches the resolutions from the server
  * based on the video streams that are available through YouTube.
  */
  const displayResolutions = async (e) => {
    e.preventDefault();

    if (!downloadResolutions) {
      // update downloader state hooks
      setDownloadModal(true);
      setDownloadLoader(true);
      setDownloadResolutions([]);
  
      fetch(PROXY_URL + `/api/get-resolutions?video_id=${videoId}`)
        .then(response => response.json()
        .then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
          if (status !== 200) {
            throw new Error(body.error);
          }
          setDownloadLoader(false);
          setDownloadResolutions(body.resolutions);
        })
        .catch(error => {
          setDownloadModal(false);
          setDownloadLoader(false);
          window.alert(error.message);
        });
    } else {
      // avoid reloading resolutions if already done once for the video
      setDownloadModal(true);
    }
  }

  /**
  * Handle the download of a YouTube video based on the selected resolution.
  *
  * This function is triggered by clicking the download button on the download 
  * modal. It checks if a resolution is selected and fetches the download URL
  * from the server. If the URL is successfully retrieved, it creates a link
  * element to initiate the download of the video as a file attachment.
  */
  const downloadVideo = async (e) => {
    e.preventDefault();
  
    if (selectedResolution === "") {
      // throw warning if no resolution is selected
      window.alert("Please select a resolution!");
    } else {
      try {
        setIsDownloading(true);
        const response = await fetch(PROXY_URL + `/api/get-download?video_id=${videoId}&video_resolution=${selectedResolution}`);
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoTitle} [${selectedResolution}].mp4`; // You can customize the filename as needed
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setIsDownloading(false);
      } catch (error) {
        setIsDownloading(false);
        console.error('There was a problem with the fetch operation:', error);
        window.alert('Failed to download the video. Please try again.');
      }
    }
  }

  return (
    <div className="app">
      <div className="app-main">
        <Logo
          logoTitle={"YT Rehashed"}
          logoSrc={process.env.PUBLIC_URL + '/logo512.png'}
        />

        <LinkForm
          prompt={"Enter the link to summarize your YouTube video:"}
          placeholder={"https://www.youtube.com/watch?v="}
          inputLink={inputLink}
          setLink={setLink}
          onSubmit={generateSummaries}
        />

        <Loader
          loaderTrigger={summaryLoader}
          loaderType={"summary-loader"}
        />

        {videoSummary && (
          <div className="result">
            <VideoPlayer videoId={videoId} displayResolutions={displayResolutions} animationDelay={0}/>
            <SummaryBox summaryTitle={"Video Summary"} summaryText={videoSummary} animationDelay={0.5}/>
          </div>
        )}

        {commentSummary && (
          <div className="result">
            <CommentSection comments={comments} animationDelay={0.75}/>
            <SummaryBox summaryTitle={"Comments Summary"} summaryText={commentSummary} animationDelay={1}/>
          </div>
        )}

        <DownloadModal
          downloadModal={downloadModal}
          setDownloadModal={setDownloadModal}
          downloadLoader={downloadLoader}
          downloadResolutions={downloadResolutions}
          selectedResolution={selectedResolution}
          setSelectedResolution={setSelectedResolution}
          progressEndpoint={PROXY_URL + '/api/get-progress'}
          isDownloading={isDownloading}
          downloadVideo={downloadVideo}
          progress={progress}
          setProgress={setProgress}
        />
      </div>
    </div>
  );
}

export default App;