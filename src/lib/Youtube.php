<?php
namespace TOL\PhotoHack;

use Google_Client;
use Google_Http_MediaFileUpload;
use Google_Service_YouTube;
use Google_Service_YouTube_Video;
use Google_Service_YouTube_VideoSnippet;
use Google_Service_YouTube_VideoStatus;

class Youtube
{
    protected $_client;

    public function __construct(Google_Client $client)
    {
        $this->_client = $client;
    }

    public function uploadVideo($path, $title, $description, array $tags = [])
    {
        $youtube = new Google_Service_YouTube($this->_client);

        if (!$this->_client->getAccessToken()) {
            return false;
        }

        // Associate the snippet and status objects with a new video resource.
        $video = new Google_Service_YouTube_Video();
        $video->setSnippet($this->_buildSnippet($title, $description, $tags));
        $video->setStatus($this->_buildStatus());

        $status = $this->_uploadVideo($client, $youtube, $video, $path);

        return $status['id'];
    }

    protected function _uploadVideo(Google_Client $client, Google_Service_YouTube $youtube, Google_Service_YouTube_Video $video, $path)
    {
        $chunkSize = 1024 * 1024;

        $client->setDefer(true);

        $insertRequest = $youtube->videos->insert('status,snippet', $video);
        $media = new Google_Http_MediaFileUpload($client, $insertRequest, 'video/*', null, true, $chunkSize);
        $media->setFileSize(filesize($path));

        $status = false;
        $handle = fopen($path, 'rb');
        while (!$status && !feof($handle)) {
            $status = $media->nextChunk(fread($handle, $chunkSize));
        }

        fclose($handle);

        $client->setDefer(false);

        return $status;
    }

    protected function _buildSnippet($title, $description, array $tags)
    {
        $snippet = new Google_Service_YouTube_VideoSnippet();
        $snippet->setTitle($title);
        $snippet->setDescription($description);
        $snippet->setTags($tags);
        $snippet->setCategoryId('22'); // Numeric video category. See https://developers.google.com/youtube/v3/docs/videoCategories/list

        return $snippet;
    }

    protected function _buildStatus()
    {
        $status = new Google_Service_YouTube_VideoStatus();
        $status->privacyStatus = 'public';

        return $status;
    }
}
