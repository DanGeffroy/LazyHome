'use strict'

var React = require('react')
var io = require('socket.io-client')
var ReactDOM = require('react-dom')

var CloseButton = require('../Components/CloseButton.jsx')
var ControlButton = require('../Components/ControlButton.jsx')
var SearchBar = require('../Components/SearchBar.jsx')
var UniversalError = require('../Components/UniversalError.jsx')

var MESSAGES = {
  errorUrlFormat: 'Wrong URL Format',
  searchBarPlaceholder: 'Search ...',
  title: 'Youtube',
  logo: 'fa fa-youtube-play fa-5x'
}
var COLOR = 'red'
var timeout
var timeoutClick
var CHIPS_OUT = 3000
var OriginalIncrement = 1
var socket = io()

function onClickPlay () {
  socket.emit('Youtube:resume')
}

function onClickPause () {
  socket.emit('Youtube:pause')
}

function onClickPrevious () {
  socket.emit('Youtube:previous')
}

function onClickNext () {
  socket.emit('Youtube:next')
}

function onClickBigNext () {
  socket.emit('Youtube:bigNext')
}

function onClickClear () {
  socket.emit('Youtube:clear')
}

function setVolume (volume) {
  socket.emit('Youtube:volume', volume)
}

function onNewUrl (url) {
  var id = videoURL_parser(url)
  if (!id) {
    id = playlistURL_parser(url)
    if (!id) {
      showError(MESSAGES.errorUrlFormat, CHIPS_OUT)
    } else {
      socket.emit('Youtube:add', url)
    }
  } else {
    socket.emit('Youtube:add', url)
  }
}

function videoURL_parser (url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  var match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : false
}

function playlistURL_parser (url) {
  var regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/
  var match = url.match(regExp)
  return (match && match[2]) ? match[2] : false
}

function showError (message, duration) {
  clearTimeout(timeout)
  ReactDOM.render(<UniversalError>{message}</UniversalError>, document.getElementById('YoutubeErrorRow'))
  timeout = setTimeout(() => ReactDOM.render(<div></div>, document.getElementById('YoutubeErrorRow')), duration)
}

module.exports = React.createClass({
  getInitialState: function () {
    return {volume: 50,
            duration: 0,
            increment: OriginalIncrement,
            down: false
           }
  },
  autoInc: function (inc) {
    if (this.state.down) {
      this.incVolume(inc)
      this.setState({duration: this.state.duration + 1})
      if (this.state.increment < OriginalIncrement * 10 && this.state.volume % 5 === 0) {
        this.setState({increment: 5 * Math.ceil(this.state.duration / 5)})
      }
      timeoutClick = setTimeout(() => { this.autoInc(inc) }, 500)
    }
  },
  incVolume: function (inc) {
    var newVolume = inc ? Math.min(100, this.state.volume + this.state.increment) : Math.max(0, this.state.volume - this.state.increment)
    this.setState({volume: newVolume})
    setVolume(newVolume)
  },
  onMouseDownInc: function () {
    this.setState({down: true})
    setTimeout(() => { this.autoInc(true) }, 1)
  },
  onMouseDownDec: function () {
    this.setState({down: true})
    setTimeout(() => { this.autoInc(false) }, 1)
  },
  onMouseUp: function () {
    clearTimeout(timeoutClick)
    this.setState({duration: 0,
                   increment: OriginalIncrement,
                   down: false})
  },
  render: function () {
    var cardClasses = 'card lighten-5 page ' + COLOR
    var logoClasses = MESSAGES.logo + ' ' + COLOR + '-text'
    return (
      <div className='col s12'>
        <div className={cardClasses} id='YoutubeControls'>
          <div className='container'>
            <div className='row'>
              <div className='col s11 black-text center-align' id='Title'>
                <i className={logoClasses}></i><h1>{MESSAGES.title}</h1>
              </div>
              <div className='col s1 black-text right-align'>
                <CloseButton onClick={this.props.close}/>
              </div>
            </div>
            <div className='row'>
              <div className='col s12' id='YoutubeErrorRow'>
              </div>
            </div>
            <div className='row'>
              <div className='col s12'>
                <SearchBar color={COLOR} placeholder={MESSAGES.searchBarPlaceholder} onSubmit={onNewUrl}/>
              </div>
            </div>
            <div className='row'>
              <div className='col s3 center-align'>
                <ControlButton color={COLOR} onClick={onClickPrevious}><i className='fa fa-step-backward fa-5x'></i></ControlButton>
              </div>
              <div className='col s3 center-align'>
                <ControlButton color={COLOR} onClick={onClickPlay}><i className='fa fa-play fa-5x'></i></ControlButton>
              </div>
              <div className='col s3 center-align'>
                <ControlButton color={COLOR} onClick={onClickNext}><i className='fa fa-step-forward fa-5x'></i></ControlButton>
              </div>
              <div className='col s3 center-align'>
                <ControlButton color={COLOR} onTouchEnd={this.onMouseUp} onMouseUp={this.onMouseUp}
                  onTouchStart={this.onMouseDownInc} onMouseDown={this.onMouseDownInc}><i className='fa fa-plus fa-5x'></i></ControlButton>
              </div>
            </div>
            <div className='row'>
              <div className='col s3 center-align'>
                <ControlButton color={COLOR} onClick={onClickClear}><i className='fa fa-trash fa-5x'></i></ControlButton>
              </div>
              <div className='col s3 center-align'>
                <ControlButton color={COLOR} onClick={onClickPause}><i className='fa fa-pause fa-5x'></i></ControlButton>
              </div>
              <div className='col s3 center-align'>
                <ControlButton color={COLOR} onClick={onClickBigNext}><i className='fa fa-arrow-right fa-5x'></i></ControlButton>
              </div>
              <div className='col s3 center-align'>
                <span id='VolumeText'>{this.state.volume}</span>
              </div>
            </div>
            <div className='row'>
              <div className='col s3 offset-s3 center-align'>
                <a className='waves-effect waves-light btn-large red lighten-3 btn-flat' href='/Youtube' target='_blank'>
                  <b>Watch</b>
                </a>
              </div>
              <div className='col s3 offset-s3 center-align'>
                <ControlButton color={COLOR} onTouchEnd={this.onMouseUp} onMouseUp={this.onMouseUp}
                  onTouchStart={this.onMouseDownDec} onMouseDown={this.onMouseDownDec}><i className='fa fa-minus fa-5x'></i></ControlButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
})
