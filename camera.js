(function () {
    'use strict';

    var SCREEN_WIDTH = 160;
    var SCREEN_HEIGHT = 144;
    var SCALE_FACTOR = 4;

    var RATIO = 1/17;
    var MATRIX = [
        [1,  9,  3,  11],
        [13, 5,  15, 7 ],
        [4,  12, 2,  10],
        [16, 8,  14, 6 ]
    ];

    var PALETTE = [
        [108, 108, 78 ],
        [142, 139, 97 ],
        [195, 196, 165],
        [227, 230, 201]
    ];

    var INTERVAL = Math.floor(1000 / 15); // 15 fps

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.msURL || window.oURL;

    if (!navigator.getUserMedia) {
        document.body.addClass('no-camera');
        return;
    }

    var video = document.getElementById('video'),
        canvas = document.getElementById('camera'),
        download = document.getElementById('download'),
        bufferCanvas = document.createElement('canvas'),
        toggleButton = document.getElementById('toggle'),
        context = canvas.getContext('2d'),
        buffer = bufferCanvas.getContext('2d'),
        isOn = false,
        stream;

    video.autoplay = true;
    video.muted = true;
    video.style.display = 'none';

    canvas.width = SCREEN_WIDTH * SCALE_FACTOR;
    canvas.height = SCREEN_HEIGHT * SCALE_FACTOR;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    bufferCanvas.width = SCREEN_WIDTH;
    bufferCanvas.height = SCREEN_HEIGHT;

    context.mozImageSmoothingEnabled = false;
    context.oImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;

    context.fillStyle = 'rgb(' + PALETTE[0][0] + ', '+ PALETTE[0][1] + ', ' + PALETTE[0][2] + ')';
    context.fillRect(0, 0, SCREEN_WIDTH * SCALE_FACTOR, SCREEN_HEIGHT * SCALE_FACTOR);

    document.body.style['color']            = 'rgb(' + PALETTE[0][0] + ', '+ PALETTE[0][1] + ', ' + PALETTE[0][2] + ')';
    document.body.style['background-color'] = 'rgb(' + PALETTE[3][0] + ', '+ PALETTE[3][1] + ', ' + PALETTE[3][2] + ')';

    setControl('toggle',   true);
    setControl('restart',  false);
    setControl('download', false);
    setControl('photo',    false);

    ///

    window.toggleStream = function () {
        if (isOn) {
            isOn = false;

            setControl('toggle',   true);
            setControl('restart',  false);
            setControl('download', false);
            setControl('photo',    false);

            if (stream.stop) {
                stream.stop();
                stream = null;
            }
        } else {
            if (stream) {
                setControl('toggle',   true);
                setControl('restart',  false);
                setControl('download', false);
                setControl('photo',    true);

                isOn = true;
                startDrawing();

                return false;
            }

            navigator.getUserMedia(
                {
                    audio: false,
                    video: true
                },

                function success (_stream) {
                    stream = _stream;

                    isOn = true;

                    setControl('toggle',   true);
                    setControl('restart',  false);
                    setControl('download', false);
                    setControl('photo',    true);

                    video.src = window.URL.createObjectURL(stream);
                    startDrawing();

                    window.stream = stream;
                    window.video  = video;
                },

                function error () {
                    alert('Oh darn, there was some sort of error. Sorry :(');
                    // perhaps do something?
                }
            );
        }

        toggleButton.className = isOn ? 'active' : '';

        return false;
    }

    window.takePhoto = function () {
        isOn = false;

        setControl('toggle',   false);
        setControl('restart',  true);
        setControl('download', true);
        setControl('photo',    false);

        download.download = 'Photo ' + Math.floor(Date.now() / 1000) + '.png';
        download.href     = bufferCanvas.toDataURL('image/png');
    }

    ///

    function setControl (control, visible) {
        document.getElementById(control).style.display = visible ? '' : 'none';
    }

    function startDrawing () {
        if (isOn) setTimeout(function () {
            drawFrame();
            startDrawing();
        }, INTERVAL);
    }

    function drawFrame () {
        var vw = video.videoWidth,
            vh = video.videoHeight,
            scale = Math.max(SCREEN_WIDTH / vw, SCREEN_HEIGHT / vh);

        buffer.drawImage(video, 0, 0, vw, vh,
            (SCREEN_WIDTH - vw * scale) / 2, (SCREEN_HEIGHT - vh * scale) / 2,
            vw * scale, vh * scale);

        var pixels = buffer.getImageData(0, 0, bufferCanvas.width, bufferCanvas.height),
            data = pixels.data;

        for (let y = 0, h = pixels.height; y < h; y += 1 ) {
            for (let x = 0, w = pixels.width; x < w; x += 1) {
                let i = 4 * (y * w + x);

                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                let v = 0.2126*r + 0.7152*g + 0.0722*b;

                v += RATIO * v * (MATRIX[x % 4][y % 4]);
                v = Math.round(3 * Math.min(v, 255) / 255);

                data[i]     = PALETTE[v][0];
                data[i + 1] = PALETTE[v][1];
                data[i + 2] = PALETTE[v][2];
            }
        }

        buffer.putImageData(pixels, 0, 0);

        context.drawImage(bufferCanvas, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0,
            SCREEN_WIDTH * SCALE_FACTOR, SCREEN_HEIGHT * SCALE_FACTOR);
    };
})();
