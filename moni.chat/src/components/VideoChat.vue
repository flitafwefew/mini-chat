<template>
    <div v-if="isVideoChat" class="video-chat-container">
        <div class="video-chat">

            <!-- 自己的视频 -->
            <video ref="local" autoplay muted playsinline
                style="position: absolute; top: 0; left: 0; width: 0; height: 0;"></video>
            <!-- 对方的视频 -->
            <video ref="remote" autoplay playsinline
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></video>

            <!-- 发起者按钮 -->
            <div v-if="props.isCaller && !isConnected" class="button-container">
                <div class="callerInfo">
                    <div>
                        <Avatar :name="props.targetInfo.targetName" :size="60" />
                    </div>
                    <div>{{ props.targetInfo.targetName }}</div>
                    <div class="call-status">
                        <span v-if="props.onlyAudio">语音通话中...</span>
                        <span v-else>视频通话中...</span>
                    </div>
                </div>
                <div v-if="time > 0" class="timer">{{ formattedTime }}</div>
                <button @click="handleHangup">
                    <span>
                        <svg t="1741938332152" class="icon" viewBox="0 0 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="1740" width="60" height="60">
                            <path
                                d="M512 1023.999069a508.779681 508.779681 0 0 1-199.291759-40.238472 510.300163 510.300163 0 0 1-162.745886-109.73071A510.354466 510.354466 0 0 1 40.231646 711.284001 508.826226 508.826226 0 0 1 0.000931 512a508.841741 508.841741 0 0 1 40.238472-199.291759 510.338951 510.338951 0 0 1 109.73071-162.745886A510.292406 510.292406 0 0 1 312.708241 40.239403 508.787439 508.787439 0 0 1 512 0.000931a508.795196 508.795196 0 0 1 199.291759 40.238472 510.222587 510.222587 0 0 1 162.745886 109.722952 510.284648 510.284648 0 0 1 109.730709 162.745886A508.841741 508.841741 0 0 1 1023.999069 512a508.826226 508.826226 0 0 1-40.238472 199.291759 510.292406 510.292406 0 0 1-109.73071 162.745886 510.27689 510.27689 0 0 1-162.745886 109.730709A508.795196 508.795196 0 0 1 512 1023.999069zM252.695744 543.348307a13.4904 13.4904 0 0 0 3.878781 9.471982 13.335248 13.335248 0 0 0 9.471983 3.917569l127.456738-0.201697a13.428339 13.428339 0 0 0 13.412824-13.412824l0.06206-51.680875a87.272569 87.272569 0 0 1 24.420804-20.030025 161.489161 161.489161 0 0 1 82.493911-20.16966h0.279272a159.573043 159.573043 0 0 1 82.230154 20.084327 86.985539 86.985539 0 0 1 24.296683 20.084327v51.362816a13.358521 13.358521 0 0 0 3.878781 9.471983 13.226643 13.226643 0 0 0 9.425437 3.917568l114.400762-0.170666h13.110279a13.358521 13.358521 0 0 0 9.495255-3.917569 13.451612 13.451612 0 0 0 3.878781-9.495255l0.054303-29.168432a13.226643 13.226643 0 0 0-0.387878-3.157327l-0.558544-2.327269a88.436203 88.436203 0 0 0-6.826655-27.570374c-25.553408-59.453953-131.288973-104.292659-245.914704-104.292659h-0.589575a511.355191 511.355191 0 0 0-134.903997 18.967238c-45.102463 12.776704-80.802762 30.681156-100.514726 50.424151a114.990336 114.990336 0 0 0-24.901773 35.645996 86.357176 86.357176 0 0 0-7.57138 34.505634l-0.054303 27.787586z"
                                fill="#FC4A46" p-id="1741"></path>
                        </svg>
                    </span>
                </button>
                <button @click="handleMute">
                    <span v-if="!isMute">
                        <svg t="1741938844950" class="icon" viewBox="0 0 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="8922" width="60" height="60">
                            <path
                                d="M676.68 256.62V512c0 43.89-16.13 81.47-48.38 112.73-32.25 31.26-71.02 46.89-116.31 46.89-45.29 0-84.06-15.63-116.31-46.89C363.43 593.47 347.3 555.9 347.3 512V256.62c0-43.89 16.13-81.47 48.38-112.73C427.94 112.63 466.71 97 512 97c45.29 0 84.06 15.63 116.31 46.89 32.25 31.25 48.37 68.83 48.37 112.73z m131.75 191.53V512c0 73.49-25.3 137.42-75.91 191.79-50.61 54.37-113.13 85.54-187.58 93.52v65.84h131.75c8.92 0 16.64 3.16 23.16 9.48s9.78 13.8 9.78 22.45c0 8.65-3.26 16.13-9.78 22.45s-14.24 9.48-23.16 9.48H347.32c-8.92 0-16.64-3.16-23.16-9.48s-9.78-13.8-9.78-22.45c0-8.65 3.26-16.13 9.78-22.45s14.24-9.48 23.16-9.48h131.75v-65.84c-74.45-7.98-136.98-39.16-187.58-93.52-50.61-54.37-75.91-118.3-75.91-191.79v-63.85c0-8.65 3.26-16.13 9.78-22.45s14.24-9.48 23.16-9.48 16.64 3.16 23.16 9.48 9.78 13.8 9.78 22.45V512c0 61.52 22.56 114.14 67.67 157.87 45.12 43.73 99.41 65.59 162.88 65.59s117.76-21.86 162.88-65.59C720 626.14 742.55 573.52 742.55 512v-63.85c0-8.65 3.26-16.13 9.78-22.45s14.24-9.48 23.16-9.48 16.64 3.16 23.16 9.48c6.52 6.33 9.78 13.81 9.78 22.45z"
                                fill="#333333" p-id="8923"></path>
                        </svg>
                    </span>
                    <span v-else>
                        <svg t="1741938447893" class="icon" viewBox="0 0 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="3666" width="60" height="60">
                            <path
                                d="M512 0A512 512 0 1 0 1024 512 512 512 0 0 0 512 0z m-122.88 318.452747a100.149451 100.149451 0 0 1 200.298901 0v58.289231L418.827253 562.637363a99.024176 99.024176 0 0 1-29.482198-70.667253z m-93.622857 168.116044a20.93011 20.93011 0 0 1 41.86022 0 19.354725 19.354725 0 0 1 0 4.050989A148.086154 148.086154 0 0 0 382.593407 598.196044l-27.006594 30.607472a189.046154 189.046154 0 0 1-60.08967-138.183736 9.227253 9.227253 0 0 1 0-4.050989z m396.321758 32.407912a19.57978 19.57978 0 0 1 0 4.050989 190.846593 190.846593 0 0 1-166.540659 180.043956v51.762638h33.308132a24.981099 24.981099 0 0 1 0 49.962198H441.107692a24.981099 24.981099 0 1 1 0-49.962198h33.308132v-51.762638A192.421978 192.421978 0 0 1 405.098901 679.665934l28.581978-31.507692a150.336703 150.336703 0 0 0 217.178022-133.457583 20.705055 20.705055 0 0 1 20.48-16.654066 20.93011 20.93011 0 0 1 20.48 16.654066z m-223.47956 90.021978l131.432088-144.260219v50.187252a99.024176 99.024176 0 0 1-131.432088 94.072967z m285.36967-326.32967L301.123516 769.012747A21.155165 21.155165 0 0 1 270.065934 740.430769l452.81055-486.343736a21.155165 21.155165 0 0 1 30.832527 28.807033z"
                                fill="#2c2c2c" p-id="3667"></path>
                        </svg>
                    </span>
                </button>
            </div>
            <!-- 接收者按钮 -->
            <div v-if="props.isCalled && !isConnected" class="button-container">
                <div class="callerInfo">
                    <div>
                        <Avatar :name="props.targetInfo.targetName" :size="60" />
                    </div>
                    <div>{{ props.targetInfo.targetName }}</div>
                </div>
                <div>
                    <button @click="onAccept">
                        <span>
                            <svg t="1741938997849" class="icon" viewBox="0 0 1024 1024" version="1.1"
                                xmlns="http://www.w3.org/2000/svg" p-id="12593" width="60" height="60">
                                <path
                                    d="M512 0C229.003636 0 0 229.003636 0 512s229.003636 512 512 512 512-229.003636 512-512S794.996364 0 512 0z m248.552727 701.905455c-2.792727 10.24-8.378182 19.549091-13.963636 29.78909-3.723636 5.585455-6.516364 11.170909-10.24 16.756364l-5.585455 5.585455c-2.792727 1.861818-4.654545 2.792727-7.447272 4.654545-9.309091 4.654545-19.549091 6.516364-29.789091 6.516364-14.894545 0-29.789091-2.792727-43.752728-4.654546-38.167273-4.654545-71.68-20.48-104.261818-40.029091-23.272727-13.963636-44.683636-29.789091-65.163636-46.545454-16.756364-13.963636-32.581818-28.858182-49.338182-42.821818-0.930909-0.930909-1.861818-0.930909-1.861818-1.861819L394.705455 595.781818c0-0.930909-0.930909-0.930909-0.93091-1.861818-17.687273-18.618182-35.374545-38.167273-51.2-57.716364-21.410909-26.065455-40.029091-53.992727-54.923636-84.712727-10.24-21.410909-17.687273-44.683636-23.272727-67.956364-3.723636-13.963636-6.516364-28.858182-7.447273-43.752727-0.930909-11.170909 0-21.410909 3.723636-31.650909 1.861818-3.723636 4.654545-8.378182 6.516364-12.101818l5.585455-5.585455c8.378182-4.654545 15.825455-9.309091 24.203636-13.032727 9.309091-4.654545 18.618182-8.378182 28.858182-10.24 13.963636-2.792727 26.065455 0.930909 37.236363 9.309091 0 0 0.930909 0.930909 1.861819 0.930909l8.378181 8.378182c2.792727 3.723636 5.585455 6.516364 8.378182 10.24 17.687273 23.272727 33.512727 48.407273 45.614546 75.403636 8.378182 18.618182 4.654545 34.443636-8.378182 50.269091-3.723636 4.654545-7.447273 8.378182-11.170909 12.101818-6.516364 8.378182-8.378182 17.687273-6.516364 27.927273 1.861818 10.24 6.516364 18.618182 12.101818 27.927273 9.309091 13.963636 20.48 26.065455 31.650909 37.236363 20.48 20.48 40.96 40.96 62.37091 61.44 11.170909 11.170909 23.272727 21.410909 38.167272 28.858182l13.963637 5.585455c13.032727 3.723636 25.134545 0.930909 35.374545-9.309091 5.585455-4.654545 11.170909-9.309091 17.687273-13.963636 13.032727-8.378182 26.996364-9.309091 40.96-2.792728 26.065455 13.032727 52.130909 27.927273 75.403636 45.614546 3.723636 2.792727 7.447273 6.516364 11.170909 9.309091 0.930909 0.930909 1.861818 0.930909 1.861818 1.861818l6.516364 6.516363c2.792727 3.723636 5.585455 6.516364 7.447273 10.24 7.447273 10.24 8.378182 20.48 4.654545 31.65091z"
                                    fill="#1afa29" p-id="12594"></path>
                            </svg>
                        </span>
                    </button>
                    <button @click="handleHangup">
                        <span>
                            <svg t="1741938332152" class="icon" viewBox="0 0 1024 1024" version="1.1"
                                xmlns="http://www.w3.org/2000/svg" p-id="1740" width="60" height="60">
                                <path
                                    d="M512 1023.999069a508.779681 508.779681 0 0 1-199.291759-40.238472 510.300163 510.300163 0 0 1-162.745886-109.73071A510.354466 510.354466 0 0 1 40.231646 711.284001 508.826226 508.826226 0 0 1 0.000931 512a508.841741 508.841741 0 0 1 40.238472-199.291759 510.338951 510.338951 0 0 1 109.73071-162.745886A510.292406 510.292406 0 0 1 312.708241 40.239403 508.787439 508.787439 0 0 1 512 0.000931a508.795196 508.795196 0 0 1 199.291759 40.238472 510.222587 510.222587 0 0 1 162.745886 109.722952 510.284648 510.284648 0 0 1 109.730709 162.745886A508.841741 508.841741 0 0 1 1023.999069 512a508.826226 508.826226 0 0 1-40.238472 199.291759 510.292406 510.292406 0 0 1-109.73071 162.745886 510.27689 510.27689 0 0 1-162.745886 109.730709A508.795196 508.795196 0 0 1 512 1023.999069zM252.695744 543.348307a13.4904 13.4904 0 0 0 3.878781 9.471982 13.335248 13.335248 0 0 0 9.471983 3.917569l127.456738-0.201697a13.428339 13.428339 0 0 0 13.412824-13.412824l0.06206-51.680875a87.272569 87.272569 0 0 1 24.420804-20.030025 161.489161 161.489161 0 0 1 82.493911-20.16966h0.279272a159.573043 159.573043 0 0 1 82.230154 20.084327 86.985539 86.985539 0 0 1 24.296683 20.084327v51.362816a13.358521 13.358521 0 0 0 3.878781 9.471983 13.226643 13.226643 0 0 0 9.425437 3.917568l114.400762-0.170666h13.110279a13.358521 13.358521 0 0 0 9.495255-3.917569 13.451612 13.451612 0 0 0 3.878781-9.495255l0.054303-29.168432a13.226643 13.226643 0 0 0-0.387878-3.157327l-0.558544-2.327269a88.436203 88.436203 0 0 0-6.826655-27.570374c-25.553408-59.453953-131.288973-104.292659-245.914704-104.292659h-0.589575a511.355191 511.355191 0 0 0-134.903997 18.967238c-45.102463 12.776704-80.802762 30.681156-100.514726 50.424151a114.990336 114.990336 0 0 0-24.901773 35.645996 86.357176 86.357176 0 0 0-7.57138 34.505634l-0.054303 27.787586z"
                                    fill="#FC4A46" p-id="1741"></path>
                            </svg>
                        </span>
                    </button>
                </div>

            </div>

            <!-- 接收者接听后按钮 -->
            <div v-if="props.isCalled && isConnected" class="button-container">
                <div class="callerInfo">
                    <div>
                        <Avatar :name="props.targetInfo.targetName" :size="60" />
                    </div>
                    <div>{{ props.targetInfo.targetName }}</div>
                </div>
                <div v-if="time > 0" class="timer">{{ formattedTime }}</div>
                <div>
                    <button @click="handleHangup">
                        <span>
                            <svg t="1741938332152" class="icon" viewBox="0 0 1024 1024" version="1.1"
                                xmlns="http://www.w3.org/2000/svg" p-id="1740" width="60" height="60">
                                <path
                                    d="M512 1023.999069a508.779681 508.779681 0 0 1-199.291759-40.238472 510.300163 510.300163 0 0 1-162.745886-109.73071A510.354466 510.354466 0 0 1 40.231646 711.284001 508.826226 508.826226 0 0 1 0.000931 512a508.841741 508.841741 0 0 1 40.238472-199.291759 510.338951 510.338951 0 0 1 109.73071-162.745886A510.292406 510.292406 0 0 1 312.708241 40.239403 508.787439 508.787439 0 0 1 512 0.000931a508.795196 508.795196 0 0 1 199.291759 40.238472 510.222587 510.222587 0 0 1 162.745886 109.722952 510.284648 510.284648 0 0 1 109.730709 162.745886A508.841741 508.841741 0 0 1 1023.999069 512a508.826226 508.826226 0 0 1-40.238472 199.291759 510.292406 510.292406 0 0 1-109.73071 162.745886 510.27689 510.27689 0 0 1-162.745886 109.730709A508.795196 508.795196 0 0 1 512 1023.999069zM252.695744 543.348307a13.4904 13.4904 0 0 0 3.878781 9.471982 13.335248 13.335248 0 0 0 9.471983 3.917569l127.456738-0.201697a13.428339 13.428339 0 0 0 13.412824-13.412824l0.06206-51.680875a87.272569 87.272569 0 0 1 24.420804-20.030025 161.489161 161.489161 0 0 1 82.493911-20.16966h0.279272a159.573043 159.573043 0 0 1 82.230154 20.084327 86.985539 86.985539 0 0 1 24.296683 20.084327v51.362816a13.358521 13.358521 0 0 0 3.878781 9.471983 13.226643 13.226643 0 0 0 9.425437 3.917568l114.400762-0.170666h13.110279a13.358521 13.358521 0 0 0 9.495255-3.917569 13.451612 13.451612 0 0 0 3.878781-9.495255l0.054303-29.168432a13.226643 13.226643 0 0 0-0.387878-3.157327l-0.558544-2.327269a88.436203 88.436203 0 0 0-6.826655-27.570374c-25.553408-59.453953-131.288973-104.292659-245.914704-104.292659h-0.589575a511.355191 511.355191 0 0 0-134.903997 18.967238c-45.102463 12.776704-80.802762 30.681156-100.514726 50.424151a114.990336 114.990336 0 0 0-24.901773 35.645996 86.357176 86.357176 0 0 0-7.57138 34.505634l-0.054303 27.787586z"
                                    fill="#FC4A46" p-id="1741"></path>
                            </svg>
                        </span>
                    </button>
                    <button @click="handleMute">
                        <span v-if="!isMute">
                            <svg t="1741938844950" class="icon" viewBox="0 0 1024 1024" version="1.1"
                                xmlns="http://www.w3.org/2000/svg" p-id="8922" width="60" height="60">
                                <path
                                    d="M676.68 256.62V512c0 43.89-16.13 81.47-48.38 112.73-32.25 31.26-71.02 46.89-116.31 46.89-45.29 0-84.06-15.63-116.31-46.89C363.43 593.47 347.3 555.9 347.3 512V256.62c0-43.89 16.13-81.47 48.38-112.73C427.94 112.63 466.71 97 512 97c45.29 0 84.06 15.63 116.31 46.89 32.25 31.25 48.37 68.83 48.37 112.73z m131.75 191.53V512c0 73.49-25.3 137.42-75.91 191.79-50.61 54.37-113.13 85.54-187.58 93.52v65.84h131.75c8.92 0 16.64 3.16 23.16 9.48s9.78 13.8 9.78 22.45c0 8.65-3.26 16.13-9.78 22.45s-14.24 9.48-23.16 9.48H347.32c-8.92 0-16.64-3.16-23.16-9.48s-9.78-13.8-9.78-22.45c0-8.65 3.26-16.13 9.78-22.45s14.24-9.48 23.16-9.48h131.75v-65.84c-74.45-7.98-136.98-39.16-187.58-93.52-50.61-54.37-75.91-118.3-75.91-191.79v-63.85c0-8.65 3.26-16.13 9.78-22.45s14.24-9.48 23.16-9.48 16.64 3.16 23.16 9.48 9.78 13.8 9.78 22.45V512c0 61.52 22.56 114.14 67.67 157.87 45.12 43.73 99.41 65.59 162.88 65.59s117.76-21.86 162.88-65.59C720 626.14 742.55 573.52 742.55 512v-63.85c0-8.65 3.26-16.13 9.78-22.45s14.24-9.48 23.16-9.48 16.64 3.16 23.16 9.48c6.52 6.33 9.78 13.81 9.78 22.45z"
                                    fill="#333333" p-id="8923"></path>
                            </svg>
                        </span>
                        <span v-else>
                            <svg t="1741938447893" class="icon" viewBox="0 0 1024 1024" version="1.1"
                                xmlns="http://www.w3.org/2000/svg" p-id="3666" width="60" height="60">
                                <path
                                    d="M512 0A512 512 0 1 0 1024 512 512 512 0 0 0 512 0z m-122.88 318.452747a100.149451 100.149451 0 0 1 200.298901 0v58.289231L418.827253 562.637363a99.024176 99.024176 0 0 1-29.482198-70.667253z m-93.622857 168.116044a20.93011 20.93011 0 0 1 41.86022 0 19.354725 19.354725 0 0 1 0 4.050989A148.086154 148.086154 0 0 0 382.593407 598.196044l-27.006594 30.607472a189.046154 189.046154 0 0 1-60.08967-138.183736 9.227253 9.227253 0 0 1 0-4.050989z m396.321758 32.407912a19.57978 19.57978 0 0 1 0 4.050989 190.846593 190.846593 0 0 1-166.540659 180.043956v51.762638h33.308132a24.981099 24.981099 0 0 1 0 49.962198H441.107692a24.981099 24.981099 0 1 1 0-49.962198h33.308132v-51.762638A192.421978 192.421978 0 0 1 405.098901 679.665934l28.581978-31.507692a150.336703 150.336703 0 0 0 217.178022-133.457583 20.705055 20.705055 0 0 1 20.48-16.654066 20.93011 20.93011 0 0 1 20.48 16.654066z m-223.47956 90.021978l131.432088-144.260219v50.187252a99.024176 99.024176 0 0 1-131.432088 94.072967z m285.36967-326.32967L301.123516 769.012747A21.155165 21.155165 0 0 1 270.065934 740.430769l452.81055-486.343736a21.155165 21.155165 0 0 1 30.832527 28.807033z"
                                    fill="#2c2c2c" p-id="3667"></path>
                            </svg>
                        </span>
                    </button>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { hangup, accept, candidate, offer, answer } from '@/api/video';
import EventBus from '@/utils/eventBus';
import { ElMessage } from 'element-plus';
import { defineProps, ref, onMounted, onUnmounted, defineEmits, nextTick, watch, computed } from 'vue';
// import { send } from '@/api/message'
import { useUserStore } from '@/stores/module/useUserStore';
import { formatTimingTime } from '@/utils/date';
import Avatar from './Avatar.vue';
import { useMessageStore } from '@/stores/module/useMessageStore';
import type { SendMessageParams } from '@/types/message'
const props = defineProps({
    isVideoChat: {
        type: Boolean,
        required: true,
        default: false
    },
    isCaller: {
        type: Boolean,
        required: true,
        default: false
    },
    isCalled: {
        type: Boolean,
        required: true,
        default: false
    },
    targetInfo: {
        type: Object,
        required: true,
    },
    onlyAudio: {
        type: Boolean,
        required: true,
        default: false
    }
});
const emit = defineEmits(['update:videoStatus'])
const local = ref<HTMLVideoElement | null>(null);
const remote = ref<HTMLVideoElement | null>(null);
const isConnected = ref(false);//是否已接通
const isMute = ref(false);//是否已关闭麦克风
const pc = ref<RTCPeerConnection | null>(null)
const timerId = ref();
const time = ref(0);
const webcamStream = ref()

watch(() => props.isVideoChat, () => {
    if (props.isVideoChat) {
        if (webcamStream.value) {
            webcamStream.value.getTracks().forEach((track: any) => {
                track.stop();
            });
            webcamStream.value = null;
        }
        // 确保在有新的邀请时，pc 不会被重置为 null
        if (!isConnected.value) {
            pc.value = null;
            time.value = 0;
        }
    }
});

watch(isMute, () => {
    if (webcamStream.value) {
        webcamStream.value.getAudioTracks().forEach((track: any) => {
            track.enabled = !isMute.value;
        })
    }
})
watch(() => props.onlyAudio, () => {
    if (webcamStream.value) {
        webcamStream.value.getVideoTracks().forEach((track: any) => {
            track.enabled = props.onlyAudio;
        })
    }
})

const handlerVideoMsg = (msg: any) => {
    switch (msg.type) {
        case 'hangup': {
            ElMessage.success('对方已挂断~');
            handleDestroyTime();
            setTimeout(async function () {
                emit('update:videoStatus');
                if (props.isCaller) {
                    const params: SendMessageParams = {
                        msgContent: String(time.value),
                        targetId: props.targetInfo.userId,
                        type: 'call',
                        source: useUserStore().user?.type as string,
                    }
                    try {
                        await useMessageStore().sendMessage(params);
                    } catch (error) {
                        console.log(error)
                    }
                }
            }, 1000);
            break;
        }
        case 'accept': {
            onOffer();
            break;
        }
        case 'candidate': {
            if (pc.value) {
                handleNewICECandidateMsg(msg)
            }
            break;
        }
        case 'offer': {
            if (!pc.value) {
                initRTCPeerConnection();
            }
            handleVideoOfferMsg(msg)
            break;
        }
        case 'answer': {
            handleVideoAnswerMsg(msg)
            break;
        }
    }
}

const initRTCPeerConnection = () => {//初始化RTCPeerConnection
    const iceServer = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302',
            },
            {
                urls: 'turn:numb.viagenie.ca',
                username: 'webrtc@live.com',
                credential: 'muazkh',
            },
        ],
    }
    pc.value = new RTCPeerConnection(iceServer)
    if (!pc.value) {
        console.error('Failed to create RTCPeerConnection');
        return;
    }
    console.log(pc);
    pc.value.onicecandidate = handleICECandidateEvent;//监听ICE候选事件
    pc.value.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;//处理ICE连接状态变化事件
    pc.value.ontrack = handleTranckEvent;//处理视频
}
const handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {//处理 ICE 候选事件
    console.log('ICE candidate event triggered:', event);
    if (event.candidate) {
        candidate({ userId: props.targetInfo.userId, candidate: event.candidate })
    }
}
const handleICEConnectionStateChangeEvent = () => {
    const connectionState = pc.value?.iceConnectionState;
    console.log('ICE连接状态变化:', connectionState);
    
    switch (connectionState) {
        case 'connected':
        case 'completed':
            ElMessage.success('通话连接成功');
            handleDestroyTime(); // 清除之前的计时器
            timerId.value = setInterval(() => {
                time.value++
            }, 1000);
            break;
        case 'disconnected':
            ElMessage.warning('网络连接不稳定，正在尝试重连...');
            break;
        case 'failed':
            ElMessage.error('连接失败，请检查网络连接');
            handleHangup();
            break;
        case 'closed':
            ElMessage.info('通话已结束');
            handleDestroyTime();
            break;
        default:
            console.log('ICE连接状态:', connectionState);
    }
}
// 处理接听
const onOffer = async () => {
    await nextTick(async () => {
        initRTCPeerConnection();
        await videoCall()
        if (pc.value) {
            const offerdesc = await pc.value.createOffer()
            await pc.value.setLocalDescription(offerdesc)
            await offer({ userId: props.targetInfo.userId, desc: pc.value.localDescription })
            console.log('发送offer', offerdesc)
        }

    })
}
const onAccept = async () => {
    isConnected.value = true;
    await nextTick(async () => {
        initRTCPeerConnection()
        await videoCall()
    })
    accept({ userId: props.targetInfo.userId }).then(() => {
        console.log('接受视频邀请成功')
    })
}
const handleTranckEvent = (event: RTCTrackEvent) => {
    console.log('接受视频流')
    if (remote.value)
        remote.value.srcObject = event.streams[0];
}
const videoCall = async () => {
    let retries = 0;
    const maxRetries = 5;
    const retryInterval = 100; // 100 毫秒

    while (retries < maxRetries) {
        await nextTick();
        if (local.value) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        retries++;
    }

    if (!local.value) {
        console.error('Local video element is still not available after retries.');
        ElMessage.error('视频元素初始化失败，请刷新页面重试');
        return;
    }
    
    try {
        await nextTick();
        if (!local.value) {
            console.error('Local video element is not available.');
            ElMessage.error('视频元素不可用，请刷新页面重试');
            return;
        }
        
        console.log('props.onlyAudio:' + props.onlyAudio)
        
        // 检查浏览器是否支持getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            ElMessage.error('您的浏览器不支持音视频通话功能');
            return;
        }
        
        const mediaConstraints = {
            video: !props.onlyAudio, // 语音通话时不请求视频
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        
        webcamStream.value = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        local.value.srcObject = webcamStream.value;
        local.value.muted = true;
        
        if (pc.value !== null) {
            webcamStream.value.getTracks().forEach((track: MediaStreamTrack) => { 
                if (pc.value) pc.value.addTrack(track, webcamStream.value) 
            });
        }
        
        console.log('媒体流获取成功');
        
    } catch (error) {
        console.error('获取媒体流失败:', error);
        
        // 根据不同的错误类型给出不同的提示
        if ((error as any).name === 'NotAllowedError') {
            ElMessage.error('请允许访问相机和麦克风权限');
        } else if ((error as any).name === 'NotFoundError') {
            ElMessage.error('未找到相机或麦克风设备');
        } else if ((error as any).name === 'NotReadableError') {
            ElMessage.error('相机或麦克风被其他应用占用');
        } else if ((error as any).name === 'OverconstrainedError') {
            ElMessage.error('设备不支持所需的媒体格式');
        } else {
            ElMessage.error('获取媒体设备失败，请检查设备连接');
        }
    }
}
const handleNewICECandidateMsg = async (data: any) => {
    const candidate = new RTCIceCandidate(data.candidate)
    try {
        if (pc.value) {
            await pc.value.addIceCandidate(candidate)
        }
    } catch (error) {
        console.log('处理新的 ICE 候选消息出错:', error);
    }
}
const handleVideoOfferMsg = async (data: any) => {
    if (!pc.value) {
        console.error('RTCPeerConnection is not initialized.');
        ElMessage.error('RTCPeerConnection 未初始化，请稍后重试。'); // 增加友好提示
        return;
    }
    const desc = new RTCSessionDescription(data.desc);
    try {
        await pc.value.setRemoteDescription(desc);
        const answerDesc = await pc.value.createAnswer();
        await pc.value.setLocalDescription(answerDesc);
        await answer({ userId: props.targetInfo.userId, desc: pc.value.localDescription });
    } catch (error) {
        console.error('Error handling video offer:', error);
        ElMessage.error('处理视频邀请时出错，请稍后重试。'); // 增加友好提示
    }
}
const handleVideoAnswerMsg = async (data: any) => {
    const desc = new RTCSessionDescription(data.desc)
    if (pc.value) {
        await pc.value.setRemoteDescription(desc).catch(reportError)
    }
}
// 处理挂断
const handleHangup = async () => {
    // 清理定时器
    handleDestroyTime()
    
    // 清理媒体流
    if (webcamStream.value) {
        webcamStream.value.getTracks().forEach((track: any) => {
            track.stop();
        });
        webcamStream.value = null;
    }
    
    // 清理WebRTC连接
    if (pc.value) {
        pc.value.close();
        pc.value = null;
    }
    
    // 后续处理逻辑
    console.log("userId" + props.targetInfo.userId)
    hangup({
        userId: props.targetInfo.userId
    })
    setTimeout(async function () {
        emit('update:videoStatus');
        isConnected.value = false;
    }, 1000);
    if (props.isCaller) {
        const params: SendMessageParams = {
            msgContent: String(time.value),
            targetId: props.targetInfo.userId,
            type: 'call',
            source: useUserStore().user?.type as string,
        }
        try {
            await useMessageStore().sendMessage(params);
        } catch (error) {
            console.log(error)
        }
    }

}
const handleDestroyTime = () => {
    if (timerId.value) clearInterval(timerId.value)
}
// 处理关闭麦克风
const handleMute = () => {
    // 后续处理逻辑
    isMute.value = !isMute.value;

}
const formattedTime = computed(() => {
    return formatTimingTime(time.value);
});
onMounted(async () => {
    EventBus.on('on-receive-video', handlerVideoMsg)
})
onUnmounted(async () => {
    EventBus.off('on-receive-video', handlerVideoMsg)
    
    // 清理定时器
    handleDestroyTime()
    
    // 清理媒体流
    if (webcamStream.value) {
        webcamStream.value.getTracks().forEach((track: any) => {
            track.stop();
        });
        webcamStream.value = null;
    }
    
    // 清理WebRTC连接
    if (pc.value) {
        pc.value.close();
        pc.value = null;
    }
})


</script>

<style scoped lang="scss">
.video-chat-container {
    position: fixed;
    /* 固定定位 */
    top: 50%;
    /* 垂直居中 */
    left: 50%;
    /* 水平居中 */
    transform: translate(-50%, -50%);
    /* 偏移居中 */
    z-index: 1000;
    /* 确保在最上层 */
    width: 30%;
    /* 设置宽度 */
    height: 90%;
    /* 设置高度 */
    background-color: rgb(90, 89, 89);
    /* 背景色 */
    border: 1px solid #ffffff;
    /* 边框 */
    border-radius: 25px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    /* 阴影 */
    display: flex;
    justify-content: center;
    align-items: center;

    @media screen and (max-width: 700px) {
        width: 100%;
        height: 100%;
    }
}

.video-chat {
    display: flex;
    position: relative;
    color: #ffffff;
    width: 100%;
    height: 100%;

    .video-chat-info {
        position: absolute;
        font-size: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        justify-content: center;
        align-items: center;
    }

}

video {
    width: 100%;
    height: 100%;
    // position: absolute;
    object-fit: cover;
}

.button-container {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    .callerInfo {
        font-size: 30px;
        bottom: 50vh;
        position: absolute;
        display: flex;
        gap: 10px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        
        .call-status {
            font-size: 16px;
            color: #ffffff;
            opacity: 0.8;
            margin-top: 5px;
        }
    }

    .timer {
        position: absolute;
        bottom: 100px;
    }
}

button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    // background-color: #007bff;
    color: white;
    cursor: pointer;
}
</style>