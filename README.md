# Homework 5: Road Generation

Jason Wang (jasonwa)

External Resources:
- [Procedural Modeling of Cities](proceduralCityGeneration.pdf) paper implementation 
- Line segment intersection check supporting parallel lines, from https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect

Demo (make your window have a 1:1 aspect ratio for best results) : https://jwang5675.github.io/hw05-road-generation/

![](images/elepop.png)

## Implemented Details
- Generating 2D Map Data
  - I used a 2D FBM Noise function with quadradtic smoothing to generate the water, elevation, and population height fields. Water and elevation is made from the same FBM function, while population density offsets the FBM in order to make the maps different from each other. By sampling different parts of the FBM function, the lower elevation portions of the elevation map has higher popualtion density near the water and the higher elevation portions of the map has lower population density.
  - To recover the noise data from the GPU to the CPU, I added an additional render pass that creates a framebuffer that renders the fbm noise to a texture. The texture stores the FBM information in RGBA texture in the format (r = waterFBM, g = elevationFBM, b = populationFBM, alpha = 1). I then use gl.readPixels() to recover the the pixel data into array format and then query x, y points in the array at index = textureHeight * y * 4 + x * 4 + offset to get fbm information (offsert = 0 implies waterFBM, = 1 implies elevationFbm, etc.)
  -  The user can toggle the gui to show the following map data:
  - Water Map (blue = water, white = land)
![](images/water.png)
  - Elevation Map (dark green = low elevation, light green = high elevation)
![](images/height.png)
  - Population Map (dark red = low population density, light red = high/dense population density)
![](images/population.png)
  - Elevation & Pop Map (elevation and population map layered on each other)
![](images/elepop.png)
