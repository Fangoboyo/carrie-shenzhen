
#### Writer Thread
Each iteration of the recording loop dequeues one encoded stream packet from the Video Encoder (VENC) channel, writes it to disk, then releases the buffer back to the codec.  `RK_MPI_VENC_GetStream()` blocks up to `timeout_ms` milliseconds, so the thread is never busy-spinning.

```c
VENC_STREAM_S stream;
VENC_PACK_S   packs[8];
memset(&stream, 0, sizeof(stream));
memset(packs, 0, sizeof(packs));
stream.pstPack = packs;
```

After initializing the stream and pack with values 0, we get the next available frame:

```c
RK_S32 ret = RK_MPI_VENC_GetStream(g_cfg.venc_chn, &stream, timeout_ms);
```

`RK_MPI_VENC_GetStream` gets the next available frame from the `g_cfg.venc_chn` which is our main channel, into our `VENC_STREAM_S stream` with a timeout.



We then check if the frame was successfully retrieved:

```c
if (ret == RK_ERR_VENC_BUF_EMPTY) {
	/* No frame ready yet — loop and try again */
    continue;
}
if (ret != RK_SUCCESS) {
    LOG_ERR("RK_MPI_VENC_GetStream failed (0x%08x)", (unsigned)ret);
    break;
}
```



After the frame is output into our buffer, we can start "stitching" the packets together, by looping through the Network Abstraction Layer (NAL) units and:

```c
VENC_PACK_S *pack = &stream.pstPack[i]; // current packet in loop


void *data = RK_MPI_MB_Handle2VirAddr(pack->pMbBlk);
```

The Rockchip hardware encoder operates in physical memory. It drops the video data into a hardware memory block `pMbBlk`.

The C program runs in Linux "user space" and cannot directly touch physical hardware memory.

`RK_MPI_MB_Handle2VirAddr` acts as a translator. It takes the hardware's memory handle and gives back a standard C pointer (data - a "Virtual Address") that your CPU can safely read. Essentially, giving an API representation that lets you interact with the hardware memory across the linux abstraction layer.


Finally, we can validate the packet packet length is not empty through `pack->u32Len (Memory length) > 0` and `data (Memory address) != null`. If this is validated, we can then write into the `g_out_file` from address `data` for `pack->u32Len` length of data.

```c
if (pack->u32Len > 0 && data != NULL) { fwrite(data, 1, pack->u32Len, g_out_file); }
```

