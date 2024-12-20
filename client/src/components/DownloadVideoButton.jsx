import React from 'react'

export default function DownloadVideoButton({ downloadVideo }) {
  return (
    <button className="submit-button" onClick={downloadVideo}>
        <p className="download-text">Download Video</p>
        <img className="download-icon-large inverted-icon" src="download.svg" alt="Download"></img>
    </button>
  )
}
