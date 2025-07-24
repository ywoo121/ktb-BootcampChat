import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import {
  LockIcon,
  ErrorCircleIcon,
  NetworkIcon,
  RefreshOutlineIcon,
  GroupIcon,
  PdfIcon,
} from "@vapor-ui/icons";
import { Button, Card, Text, Badge, Callout } from "@vapor-ui/core";
import { Flex, Box, HStack } from "../components/ui/Layout";
import {
  StyledTable,
  StyledTableHead,
  StyledTableBody,
  StyledTableRow,
  StyledTableHeader,
  StyledTableCell,
} from "../components/ui/StyledTable";
import socketService from "../services/socket";
import authService from "../services/authService";
import axiosInstance from "../services/axios";
import { withAuth } from "../middleware/withAuth";
import { Toast } from "../components/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CONNECTION_STATUS = {
  CHECKING: "checking",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

const STATUS_CONFIG = {
  [CONNECTION_STATUS.CHECKING]: { label: "연결 확인 중...", color: "warning" },
  [CONNECTION_STATUS.CONNECTING]: { label: "연결 중...", color: "warning" },
  [CONNECTION_STATUS.CONNECTED]: { label: "연결됨", color: "success" },
  [CONNECTION_STATUS.DISCONNECTED]: { label: "연결 끊김", color: "danger" },
  [CONNECTION_STATUS.ERROR]: { label: "연결 오류", color: "danger" },
};

const LoadingIndicator = ({ text }) => (
  <div className="loading-indicator">
    <div className="spinner-border spinner-border-sm me-3" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <Text typography="body3" foreground="secondary">
      {text}
    </Text>
  </div>
);

function WhiteboardsComponent() {
  const router = useRouter();
  const [whiteboards, setWhiteboards] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser] = useState(authService.getCurrentUser());
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATUS.CHECKING
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [joiningWhiteboard, setJoiningWhiteboard] = useState(false);

  const socketRef = useRef(null);
  const isLoadingRef = useRef(false);

  const handleAuthError = useCallback(
    async (error) => {
      try {
        if (
          error.response?.status === 401 ||
          error.response?.data?.code === "TOKEN_EXPIRED"
        ) {
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            return true;
          }
        }
        authService.logout();
        router.replace("/?error=session_expired");
        return false;
      } catch (error) {
        console.error("Auth error handling failed:", error);
        authService.logout();
        router.replace("/?error=auth_error");
        return false;
      }
    },
    [router]
  );

  const fetchWhiteboards = useCallback(
    async (isLoadingMore = false) => {
      if (!currentUser?.token || isLoadingRef.current) {
        return;
      }

      try {
        isLoadingRef.current = true;

        if (!isLoadingMore) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const response = await axiosInstance.get("/api/whiteboards", {
          params: {
            page: isLoadingMore ? pageIndex : 0,
            pageSize,
            sortField: "createdAt",
            sortOrder: "desc",
          },
        });

        if (!response?.data?.data) {
          throw new Error("INVALID_RESPONSE");
        }

        const { data, metadata } = response.data;

        setWhiteboards((prev) => {
          if (isLoadingMore) {
            const existingIds = new Set(prev.map((wb) => wb._id));
            const newWhiteboards = data.filter(
              (wb) => !existingIds.has(wb._id)
            );
            return [...prev, ...newWhiteboards];
          }
          return data;
        });

        setHasMore(data.length === pageSize && metadata.hasMore);
      } catch (error) {
        console.error("Whiteboards fetch error:", error);
        if (!isLoadingMore) {
          setError({
            title: "화이트보드 목록 로드 실패",
            message: "화이트보드 목록을 불러오는데 실패했습니다.",
            type: "danger",
          });
        }
      } finally {
        if (!isLoadingMore) {
          setLoading(false);
        }
        setLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [currentUser, pageIndex, pageSize]
  );

  const handleJoinWhiteboard = async (whiteboardId) => {
    if (connectionStatus !== CONNECTION_STATUS.CONNECTED) {
      setError({
        title: "화이트보드 입장 실패",
        message: "서버와 연결이 끊어져 있습니다.",
        type: "danger",
      });
      return;
    }

    setJoiningWhiteboard(true);

    try {
      const response = await axiosInstance.post(
        `/api/whiteboards/${whiteboardId}/join`,
        {},
        {
          timeout: 5000,
        }
      );

      if (response.data.success) {
        router.push(`/whiteboard?room=${whiteboardId}`);
      }
    } catch (error) {
      console.error("Whiteboard join error:", error);

      let errorMessage = "입장에 실패했습니다.";
      if (error.response?.status === 404) {
        errorMessage = "화이트보드를 찾을 수 없습니다.";
      } else if (error.response?.status === 403) {
        errorMessage = "화이트보드 입장 권한이 없습니다.";
      }

      setError({
        title: "화이트보드 입장 실패",
        message: error.response?.data?.message || errorMessage,
        type: "danger",
      });
    } finally {
      setJoiningWhiteboard(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchWhiteboards(false);
  }, [currentUser, fetchWhiteboards]);

  const renderWhiteboardsTable = () => {
    if (!whiteboards || whiteboards.length === 0) return null;

    return (
      <StyledTable>
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableHeader width="45%">화이트보드</StyledTableHeader>
            <StyledTableHeader width="15%">참여자</StyledTableHeader>
            <StyledTableHeader width="25%">생성일</StyledTableHeader>
            <StyledTableHeader width="15%">액션</StyledTableHeader>
          </StyledTableRow>
        </StyledTableHead>
        <StyledTableBody>
          {whiteboards.map((whiteboard) => (
            <StyledTableRow key={whiteboard._id}>
              <StyledTableCell>
                <Text
                  typography="body1"
                  style={{
                    fontWeight: 500,
                    marginBottom: "var(--vapor-space-050)",
                  }}
                >
                  {whiteboard.name}
                </Text>
                {whiteboard.hasPassword && (
                  <HStack gap="050" align="center">
                    <LockIcon
                      size={16}
                      style={{ color: "var(--vapor-color-warning)" }}
                    />
                    <Text
                      typography="body1"
                      style={{ color: "var(--vapor-color-warning)" }}
                    >
                      비밀번호 필요
                    </Text>
                  </HStack>
                )}
              </StyledTableCell>
              <StyledTableCell>
                <Badge
                  color="primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--vapor-space-100)",
                  }}
                >
                  <GroupIcon size={16} />
                  <Text typography="body1" style={{ color: "inherit" }}>
                    {whiteboard.participants?.length || 0}
                  </Text>
                </Badge>
              </StyledTableCell>
              <StyledTableCell>
                <Text
                  typography="body1"
                  style={{ color: "var(--vapor-color-text-muted)" }}
                >
                  {new Date(whiteboard.createdAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </StyledTableCell>
              <StyledTableCell>
                <Button
                  color="primary"
                  variant="outline"
                  size="md"
                  onClick={() => handleJoinWhiteboard(whiteboard._id)}
                  disabled={connectionStatus !== CONNECTION_STATUS.CONNECTED}
                >
                  입장
                </Button>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </StyledTableBody>
      </StyledTable>
    );
  };

  return (
    <div className="auth-container">
      <Card.Root className="chat-rooms-card">
        <Card.Body className="card-body">
          <Flex
            justify="space-between"
            align="center"
            style={{ marginBottom: "var(--vapor-space-400)" }}
          >
            <Text typography="heading3">화이트보드 목록</Text>
            <Button
              color="primary"
              onClick={() => router.push("/whiteboards/new")}
              disabled={connectionStatus !== CONNECTION_STATUS.CONNECTED}
            >
              <PdfIcon size={16} />새 화이트보드
            </Button>
          </Flex>

          {error && (
            <Box mt="400">
              <Callout color={error.type === "danger" ? "danger" : "warning"}>
                <Flex align="flex-start" gap="200">
                  <ErrorCircleIcon size={16} style={{ marginTop: "4px" }} />
                  <div>
                    <Text typography="subtitle2" style={{ fontWeight: 500 }}>
                      {error.title}
                    </Text>
                    <Text
                      typography="body2"
                      style={{ marginTop: "var(--vapor-space-050)" }}
                    >
                      {error.message}
                    </Text>
                  </div>
                </Flex>
              </Callout>
            </Box>
          )}

          {loading ? (
            <Box mt="400">
              <LoadingIndicator text="화이트보드 목록을 불러오는 중..." />
            </Box>
          ) : whiteboards.length > 0 ? (
            <Box mt="400">
              <div
                style={{
                  height: "430px",
                  overflowY: "auto",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--background-normal)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {renderWhiteboardsTable()}
              </div>
            </Box>
          ) : (
            !error && (
              <Box mt="400" style={{ textAlign: "center" }}>
                <Text
                  typography="body1"
                  style={{ marginBottom: "var(--vapor-space-400)" }}
                >
                  생성된 화이트보드가 없습니다.
                </Text>
                <Button
                  color="primary"
                  onClick={() => router.push("/whiteboards/new")}
                  disabled={connectionStatus !== CONNECTION_STATUS.CONNECTED}
                >
                  새 화이트보드 만들기
                </Button>
              </Box>
            )
          )}
        </Card.Body>
      </Card.Root>

      {joiningWhiteboard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ textAlign: "center", color: "white" }}>
            <div
              className="spinner-border spinner-border-lg text-primary mb-3"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <Text typography="body1">화이트보드 입장 중...</Text>
          </div>
        </div>
      )}
    </div>
  );
}

const Whiteboards = dynamic(() => Promise.resolve(WhiteboardsComponent), {
  ssr: false,
  loading: () => (
    <div className="auth-container">
      <Card.Root className="chat-rooms-card">
        <Card.Body className="card-body">
          <Text typography="heading3">화이트보드 목록</Text>
          <Box mt="400">
            <LoadingIndicator text="로딩 중..." />
          </Box>
        </Card.Body>
      </Card.Root>
    </div>
  ),
});

export default withAuth(Whiteboards);
