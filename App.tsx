import "expo-dev-client";
import React, { useEffect, useRef, useState } from "react";
import AgoraUIKit from "agora-rn-uikit";
import {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  createAgoraRtcEngine,
} from "react-native-agora";
import {
  AppState,
  Dimensions,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import MuiIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  Text,
  BottomNavigation as PaperBottomNavigation,
  useTheme,
  Provider as PaperThemeProvider,
  IconButton,
} from "react-native-paper";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { captureRef, captureScreen } from "react-native-view-shot";
const screen = Dimensions.get("screen");
const window = Dimensions.get("window");

const App = () => {
  const appState = useRef(AppState.currentState);
  const agoraEngineRef = useRef<IRtcEngine>(); // Agora engine instance
  const [isJoined, setIsJoined] = useState<boolean>(false); // Indicates if the local user has joined the channel
  const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [showMessages, setShowMessages] = useState<boolean>(false);
  const [showFiles, setShowFiles] = useState<boolean>(false);
  const [createdEngine, setCreatedEngine] = useState<number>();
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState<boolean>(false);
  const [isPipEnabled, setIsPipEnabled] = useState<boolean>(false);
  const uid = 0;
  const [uri, setUri] = useState<string>();
  const theme = useTheme();
  const getPermission = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };
  const {
    primary: customPrimary,
    onPrimary,
    tertiary,
    elevation: { level4 },
  } = theme.colors;
  const connectionData = {
    appId: "d0c6cf1375d34f5cb42c13748c4dd9e8",
    channel: "test",
  };

  const toggleVideo = () => {
    try {
      agoraEngineRef.current?.muteLocalVideoStream(isVideoOn);
      setIsVideoOn(!isVideoOn);
    } catch (e) {
      console.log(e);
    }
  };

  const toggleAudio = () => {
    try {
      agoraEngineRef.current?.muteLocalAudioStream(isMicOn);
      setIsMicOn(!isMicOn);
    } catch (e) {
      console.log(e);
    }
  };

  const toggleMessages = () => {
    setShowMessages(!showMessages);
  };

  const toggleFiles = () => {
    setShowFiles(!showFiles);
  };

  const leave = () => {
    try {
      agoraEngineRef.current?.leaveChannel();
      setIsJoined(false);
    } catch (e) {
      console.log(e);
    }
  };

  const setupVideoSDKEngine = async () => {
    try {
      // use the helper function to get permissions
      if (Platform.OS === "android") {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          setIsJoined(true);
        },
        onUserJoined: (_connection, Uid) => {
          setRemoteUid(Uid);
        },
        onUserOffline: (_connection, Uid) => {
          setRemoteUid(0);
        },
        onUserMuteVideo(connection, remoteUid, muted) {
          setIsRemoteVideoMuted(muted);
        },
      });
      setCreatedEngine(
        agoraEngine.initialize({
          appId: connectionData.appId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        })
      );
      agoraEngine.enableVideo();
    } catch (e) {
      console.log(e);
    }
  };

  const join = async () => {
    if (isJoined) {
      return;
    }
    try {
      agoraEngineRef.current?.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication
      );
      agoraEngineRef.current?.startPreview();
      agoraEngineRef.current?.joinChannel("", connectionData.channel, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    // Initialize Agora engine when the app starts
    setupVideoSDKEngine();
  });

  useEffect(() => {
    if (createdEngine === 0) {
      join();
    }
  }, [createdEngine]);

  const setImg = () => {
    const date = new Date();
    captureScreen({
      format: "jpg",
      quality: 0.8,
    }).then(
      (uri) => {
        console.log("Image saved to", uri);
        setUri(uri);
      },
      (error) => console.error("Oops, snapshot failed", error)
    );
  };

  /* useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        setIsPipEnabled(true);
      } else if (nextAppState === "active") {
        setIsPipEnabled(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);*/

  /*useEffect(() => {
    if (takeSnapshot) {
    }
  }, [takeSnapshot]);*/

  return (
    <>
      <SafeAreaProvider>
        <PaperThemeProvider theme={DarkTheme}>
          <SafeAreaView style={styles.main}>
            {/* <Text style={styles.head}>Agora Video Calling Quickstart</Text>
            <View style={styles.btnContainer}>
              <Text onPress={join} style={styles.button}>
                Join
              </Text>
              <Text onPress={leave} style={styles.button}>
                Leave
              </Text>
              <Text onPress={setImg} style={styles.button}>
                Take snapshot
              </Text>
  </View> */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContainer}
            >
              {isJoined && remoteUid !== 0 && (
                <>
                  {!isRemoteVideoMuted && (
                    <React.Fragment key={remoteUid}>
                      <RtcSurfaceView
                        canvas={{ uid: remoteUid }}
                        style={styles.videoView}
                      />
                    </React.Fragment>
                  )}
                  {isRemoteVideoMuted && <MutedVideo />}
                </>
              )}
              {isJoined && (
                <>
                  {isVideoOn && (
                    <React.Fragment key={0}>
                      <RtcSurfaceView
                        canvas={{ uid: 0 }}
                        style={styles.videoView}
                      />
                    </React.Fragment>
                  )}
                  {!isVideoOn && <MutedVideo />}
                </>
              )}
              {isJoined && (
                <View
                  style={{
                    position: "absolute",
                    top: window.height * 0.05,
                    right: window.width * 0.025,
                  }}
                >
                  <IconButton
                    size={25}
                    icon="image-filter-center-focus"
                    containerColor={"#0A6172"}
                    iconColor={"#fff"}
                    onPress={setImg}
                  />
                </View>
              )}
              {isJoined && (
                <View
                  style={{
                    width: window.width * 0.95,
                    height: 30,
                    position: "absolute",
                    bottom: window.height * 0.05,
                    left: window.width * 0.025,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <IconButton
                    size={25}
                    icon={isVideoOn ? "video-outline" : "video-off-outline"}
                    containerColor={isVideoOn ? "#0A6172" : "#fff"}
                    iconColor={isVideoOn ? "#fff" : "#0A6172"}
                    onPress={toggleVideo}
                  />

                  <IconButton
                    size={25}
                    icon={isMicOn ? "microphone" : "microphone-off"}
                    containerColor={isMicOn ? "#0A6172" : "#fff"}
                    iconColor={isMicOn ? "#fff" : "#0A6172"}
                    onPress={toggleAudio}
                  />

                  <IconButton
                    size={35}
                    icon="phone-hangup"
                    containerColor="#CC0000"
                    iconColor="#fff"
                    onPress={leave}
                  />
                  <IconButton
                    size={25}
                    icon="message-outline"
                    containerColor="#0A6172"
                    iconColor="#fff"
                    onPress={toggleMessages}
                  />
                  <IconButton
                    size={25}
                    icon="file-outline"
                    containerColor="#0A6172"
                    iconColor="#fff"
                    onPress={toggleFiles}
                  />
                </View>
              )}

              {showMessages && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    backgroundColor: "#fff",
                  }}
                >
                  <Message toggleMessages={toggleMessages} />
                </View>
              )}

              {showFiles && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    backgroundColor: "#fff",
                  }}
                >
                  <Files {...{ uri, toggleFiles }} />
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </PaperThemeProvider>
      </SafeAreaProvider>
      {/**/}
    </>
  );
};

export const Message = ({ toggleMessages }: { toggleMessages: () => void }) => {
  return (
    <SafeAreaView>
      <View
        style={{
          height: window.height,
          width: window.width,
        }}
      >
        <Text>Message</Text>
        <IconButton
          size={25}
          icon="message-outline"
          containerColor="#0A6172"
          iconColor="#fff"
          onPress={toggleMessages}
        />
      </View>
    </SafeAreaView>
  );
};

export const MutedVideo = () => {
  return (
    <SafeAreaView>
      <View
        style={{
          height: window.height * 0.5,
          width: window.width,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MuiIcons name="video-off" size={60} color={"#fff"} />
      </View>
    </SafeAreaView>
  );
};

export const Files = ({
  uri,
  toggleFiles,
}: {
  uri: string | undefined;
  toggleFiles: () => void;
}) => {
  return (
    <View style={{ height: window.height, width: window.width }}>
      {uri && (
        <Image
          source={{ uri: uri }}
          style={{ width: window.width * 0.7, height: window.height * 0.7 }}
        />
      )}
      <Text>{uri}</Text>
      <IconButton
        size={25}
        icon="file-outline"
        containerColor="#0A6172"
        iconColor="#fff"
        onPress={toggleFiles}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#0055cc",
    margin: 5,
  },
  main: { flex: 1, alignItems: "center" },
  scroll: { flex: 1, width: "100%" },
  scrollContainer: { alignItems: "center", minHeight: window.height },
  scrollContainerPip: { alignItems: "center", minHeight: "100%" },
  videoView: { width: "100%", height: window.height * 0.5 },
  btnContainer: { flexDirection: "row", justifyContent: "center" },
  head: { fontSize: 20 },
  info: { backgroundColor: "#ffffe0", color: "#0000ff" },
  pipVideoView: { width: "100%", height: "50%" },
});

export default App;
